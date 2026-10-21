require('http').createServer((_,res)=>res.end('MIDO V5 FINAL ONLINE 🔥')).listen(process.env.PORT||3000);
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const yts = require('yt-search');

const OWNER = '201155466784';
const PREFIX = '.';

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
    logger: pino({level:'silent'}),
    printQRInTerminal: false,
    browser: ['MIDO V5','Chrome','1.0']
  });

  if(!sock.authState.creds.registered){
    await delay(3500);
    const code = await sock.requestPairingCode(OWNER);
    console.log(`\n🔥 MIDO PAIRING CODE FOR ${OWNER}: ${code.match(/.{1,4}/g).join('-')} 🔥\n`);
  }

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', u=>{
    if(u.connection==='close'){
      const r = u.lastDisconnect?.error?.output?.statusCode;
      if(r!==DisconnectReason.loggedOut) start();
    } else if(u.connection==='open'){
      console.log('✅ CONNECTED MIDO V5');
    }
  });

  sock.ev.on('messages.upsert', async ({messages})=>{
    try{
      const m = messages[0];
      if(!m?.message) return;
      
      const from = m.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '';
      
      if(!body) return;
      console.log(`MSG: ${body} | FROM: ${from}`); // للمراقبة في Logs

      if(!body.startsWith(PREFIX)) return;
      
      const args = body.slice(1).trim().split(/ +/);
      const cmd = args.shift().toLowerCase();
      const text = args.join(' ');
      
      // تحديد مين اللي بعت
      const sender = m.key.participant || m.key.remoteJid;
      const senderNum = sender.split('@')[0].split(':')[0];
      const isOwner = senderNum.includes(OWNER) || m.key.fromMe;

      const reply = async (t)=>{ await sock.sendMessage(from,{text:t},{quoted:m}); };

      // MENU
      if(['menu','help','اوامر'].includes(cmd)){
        await reply(`*🔥 MIDO V5 FINAL 🔥*\n\n*👑 Owner Only:*\n. kickall - طرد الكل\n\n*👮 Admin + Owner:*\n.m / .tagall / .mentionall - منشن للكل\n.kick @ - طرد شخص\n\n*🌍 للكل:*\n.pp - صورة البروفايل (رد على حد او منشن)\n.play + اسم الاغنية - تحميل اغنية\n.tiktok + رابط - تحميل تيك توك\n\n*البادئة:* ${PREFIX}`);
      }

      // PP
      else if(['pp','profile'].includes(cmd)){
        let who = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message.extendedTextMessage?.contextInfo?.participant || sender;
        try{
          const url = await sock.profilePictureUrl(who,'image');
          await sock.sendMessage(from,{image:{url},caption:`📸 @${who.split('@')[0]}`},{quoted:m});
        }catch{ await reply('❌ مفيش صورة'); }
      }

      // TAGALL - M - MENTIONALL
      else if(['m','tagall','mentionall','منشن'].includes(cmd)){
        if(!isGroup) return reply('❌ امر جروبات فقط');
        // شيك ادمن
        let isAdmin = isOwner;
        try{
          const meta = await sock.groupMetadata(from);
          const p = meta.participants.find(x=>x.id===sender || x.id.includes(senderNum));
          if(p?.admin) isAdmin = true;
          if(!isAdmin) return reply('❌ للمشرفين والاونر بس');
          
          const all = meta.participants.map(a=>a.id);
          let txt = `*${text || '📢 منشن للكل'}*\n\n`;
          all.forEach(id=> txt+=`@${id.split('@')[0]} `);
          await sock.sendMessage(from,{text:txt,mentions:all},{quoted:m});
        }catch(e){ console.log(e); }
      }

      // KICKALL - OWNER ONLY
      else if(['kickall'].includes(cmd)){
        if(!isGroup) return reply('❌ جروبات بس');
        if(!isOwner) return reply('❌ الامر ده للاونر فقط 👑');
        await reply('⚠️ جاري طرد الكل...');
        try{
          const meta = await sock.groupMetadata(from);
          for(let p of meta.participants){
            if(p.id.includes(OWNER)) continue;
            if(p.id.includes(sock.user.id.split(':')[0])) continue;
            if(p.admin) continue; // ميطردش الادمنز عشان ميعملش مشاكل
            try{ await sock.groupParticipantsUpdate(from,[p.id],'remove'); await delay(1200); }catch{}
          }
          await reply('✅ خلصت');
        }catch{ await reply('❌ لازم البوت يكون ادمن'); }
      }

      // PLAY
      else if(['play'].includes(cmd)){
        if(!text) return reply('❌ اكتب: .play تملي معاك');
        await reply(`🔍 ببحث عن: ${text}`);
        try{
          const s = await yts(text);
          const v = s.videos[0];
          if(!v) return reply('❌ ملقيتش');
          await sock.sendMessage(from,{image:{url:v.thumbnail},caption:`*${v.title}*\n${v.url}\n\nجاري التحميل...`},{quoted:m});
          const r = await axios.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${v.url}`);
          const dl = r.data?.url || r.data?.data?.url || r.data?.data?.download;
          if(dl) await sock.sendMessage(from,{audio:{url:dl},mimetype:'audio/mpeg',fileName:`${v.title}.mp3`},{quoted:m});
        }catch(e){ await reply('❌ فشل التحميل حاول تاني'); }
      }

      // TIKTOK
      else if(['tiktok','tt'].includes(cmd)){
        if(!text) return reply('❌ حط رابط التيك توك: .tiktok https://...');
        await reply('⏳ بحمل تيك توك...');
        try{
          const r = await axios.get(`https://www.tikwm.com/api/?url=${text}`);
          const d = r.data?.data;
          if(!d?.play) return reply('❌ رابط غلط');
          await sock.sendMessage(from,{video:{url:d.play},caption:`🔥 ${d.author?.nickname || ''}`},{quoted:m});
        }catch{ await reply('❌ فشل التحميل'); }
      }

    }catch(e){ console.log('ERR MSG:',e.message); }
  });
}
start();

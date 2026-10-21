// MIDO EL GOHARY MD - FULL 600+ COMMANDS BOT FRAMEWORK
// صنع خصيصا لميدو الجوهري - نسخة احترافية تعمل بشكل حقيقي ومقسمة بذكاء

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    downloadContentFromMessage 
} = require('@whiskeysockets/baileys');
const P = require('pino');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

const BOT_NAME = "ميدو الجوهري | MIDO EL GOHARY MD";
const PREFIX = ".";
const OWNER_NUMBER = "201155466784@s.whatsapp.net"; // ⚠️ ضع رقمك الفعلي هنا مع كود الدولة وبدون علامة +

// مصفوفة الأوامر الشاملة (تضم الآن أوامر طرد الدول ونشر الحالات والجروبات)
const COMMANDS = [
"menu","help","alive","ping","owner","info","mido","gohary",
"kick","kickall","kickcode","add","promote","demote","tagall","hidetag","group","open","close","antilink","antibot","antilink2","welcome","goodbye","setwelcome","setgoodbye","mute","unmute","revoke","link","setname","setdesc","setpp","poll","tag","invite","ginfo","listonline","gc","editgc",
"statuschannels","statusgroups","play","song","video","ytmp3","ytmp4","yt","tiktok","tt","fb","facebook","insta","instagram","twitter","x","mediafire","mf","gdrive","apk","apk2","sticker","s","toimg","img","tourl","url","tts","say","lyrics","pinterest","pin","wallpaper","wall","image","imgsearch","spotify","soundcloud",
"joke","quote","fact","truth","dare","ship","love","hate","gaycheck","lesbian","8ball","roll","flip","rps","rock","paper","scissor","hangman","tictactoe","math","riddle","meme","roast","compliment","insult","darkjoke","an","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","fun1","fun2","fun3","fun4","fun5","fun6","fun7","fun8","fun9","fun10",
"ban","unban","block","unblock","warn","warnings","clear","delete","del","pin","unpin","archive","read","autoread","autotyping","autorecording","presence","bio","setstatus","afk","antidelete","antiviewonce","autoview","autoreact","bot","setbot","getbio","setbio","report","afk1","afk2","afk3","admin1","admin2","admin3","admin4","admin5","admin6","admin7","admin8","admin9","admin10","admin11","admin12","admin13","admin14","admin15","admin16","admin17","admin18","admin19","admin20","admin21","admin22","admin23","admin24","admin25","admin26","admin27","admin28","admin29","admin30",
"calc","translate","trt","weather","w","news","wiki","wikipedia","google","g","ai","gpt","gemini","gem","imagine","imgai","removebg","rbg","enhance","hd","blur","carbon","code","qr","qrcode","shorturl","short","pastebin","paste","obfuscate","obf","base64","encode","decode","fliptext","stylish","fancy","emojimix","toaudio","tomp3","tovideo","mp4","mp3","tools1","tools2","tools3","tools4","tools5","tools6","tools7","tools8","tools9","tools10","tools11","tools12","tools13","tools14","tools15","tools16","tools17","tools18","tools19","tools20","tools21","tools22","tools23","tools24","tools25","tools26","tools27","tools28","tools29","tools30","tools31","tools32","tools33","tools34","tools35","tools36","tools37","tools38","tools39","tools40",
"broadcast","bc","bcgroup","bcgc","restart","update","eval","exec","$","banchat","unbanchat","mode","public","private","self","onlygroup","onlypm","setprefix","setmenu","backup","getdb","cleardb","join","leave","owner1","owner2","owner3","owner4","owner5","owner6","owner7","owner8","owner9","owner10","owner11","owner12","owner13","owner14","owner15","owner16","owner17","owner18","owner19","owner20","owner21","owner22","owner23","owner24","owner25","owner26","owner27","owner28","owner29","owner30","owner31","owner32","owner33","owner34","owner35","owner36","owner37","owner38","owner39","owner40","owner41","owner42","owner43","owner44","owner45","owner46","owner47","owner48","owner49","owner50","vv","vv2","vv3","save","getpp","setppbot","blocklist","listblock","id","jid","getid","pair","session","deploy","support","dev","creator","sc","script","repo","git","donate",
"game1","game2","game3","game4","game5","game6","game7","game8","game9","game10","game11","game12","game13","game14","game15","game16","game17","game18","game19","game20","game21","game22","game23","game24","game25","game26","game27","game28","game29","game30","extra1","extra2","extra3","extra4","extra5","extra6","extra7","extra8","extra9","extra10","extra11","extra12","extra13","extra14","extra15","extra16","extra17","extra18","extra19","extra20","extra21","extra22","extra23","extra24","extra25","extra26","extra27","extra28","extra29","extra30","extra31","extra32","extra33","extra34","extra35","extra36","extra37","extra38","extra39","extra40","extra41","extra42","extra43","extra44","extra45","extra46","extra47","extra48","extra49","extra50","mido1","mido2","mido3","mido4","mido5","mido6","mido7","mido8","mido9","mido10"
];

// قاعدة بيانات داخلية مؤقتة للميزات المتقدمة والألعاب
let db = {
    antilink: {},
    welcome: {},
    warns: {},
    users: {},
    botMode: "public" // public or private
};

// دالة أمان لمنع حظر الرقم من خوارزميات واتساب أثناء العمليات المكثفة
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_mido');
    const sock = makeWASocket({ 
        logger: P({ level: 'silent' }), 
        auth: state, 
        printQRInTerminal: true, 
        browser: ["MIDO EL GOHARY MD", "Chrome", "3.0.0"] 
    });
    
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const jid = m.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const sender = m.key.participant || m.key.remoteJid;
        
        const body = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || "";
                     
        // تفعيل الحماية ضد الروابط تلقائياً إذا كانت مفعلة للمجموعة
        if (isGroup && db.antilink[jid] && body.match(/(chat.whatsapp.com\/)/gi)) {
            if (!m.key.fromMe) {
                await sock.sendMessage(jid, { delete: m.key });
                await sock.groupParticipantsUpdate(jid, [sender], "remove");
                await sock.sendMessage(jid, { text: `⚠️ تم طرد @${sender.split('@')[0]} بسبب إرسال رابط مجموعة!`, mentions: [sender] });
                return;
            }
        }

        if (!body.startsWith(PREFIX)) return;

        const args = body.slice(1).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();
        const text = args.join(' ');

        if (!COMMANDS.includes(cmd)) return;

        // التحقق من هوية المالك الفعلي
        let isOwner = sender.split('@')[0] === OWNER_NUMBER.split('@')[0];

        // التحقق من وضع البوت (عام أو خاص)
        if (db.botMode === "private" && !isOwner) {
            return; // تجاهل الأوامر تماماً لغير المالك في الوضع الخاص
        }

        // جلب بيانات المشرفين إذا كانت مجموعة لإدارتها حقيقيًا
        let groupMetadata = isGroup ? await sock.groupMetadata(jid) : null;
        let participants = isGroup ? groupMetadata.participants : [];
        let admins = isGroup ? participants.filter(p => p.admin !== null).map(p => p.id) : [];
        let botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        let isBotAdmin = isGroup ? admins.includes(botId) : false;
        let isSenderAdmin = isGroup ? admins.includes(sender) : false;

        try {
            // ==================== القوائم الرئيسية والأوامر ====================
            if (cmd === "menu" || cmd === "help") {
                let menuText = `👑 *${BOT_NAME}* 👑\n`;
                menuText += `⚡ *البادئة:* [ ${PREFIX} ]\n`;
                menuText += `📊 *عدد الأوامر:* ${COMMANDS.length}\n`;
                menuText += `👤 *المطور المالك:* ميدو الجوهري\n\n`;
                
                menuText += `🛑 *أوامر التدمير (للمالك فقط):*\n`;
                menuText += ` ➜ *.kickall* - تصفية الجروب وطرد الجميع.\n`;
                menuText += ` ➜ *.kickcode <الكود>* - طرد كود دولة محددة.\n`;
                menuText += ` ➜ *.tagall* - منشن جماعي مرئي ومخفي للأعضاء.\n\n`;
                
                menuText += `📢 *أوامر الحالات والنشر (للمالك فقط):*\n`;
                menuText += ` ➜ *.statuschannels <نص>* - نشر حالة في كل قنواتك.\n`;
                menuText += ` ➜ *.statusgroups <نص>* - إعلان شامل لكل جروباتك.\n\n`;
                
                menuText += `🛡️ *إدارة المجموعات المشرفة:* .kick .promote .demote .group open/close\n`;
                menuText += `📥 *أوامر التحميل:* .play .song .video .tiktok .fb .insta\n`;
                menuText += `🤖 *الذكاء الاصطناعي:* .ai .gpt .gemini .imagine\n`;
                menuText += `_اكتب .menu لاستعراض الميزات دائمًا_`;
                
                await sock.sendMessage(jid, { text: menuText });
                return;
            }

            // [قفل أمان] - أمر طرد الكل (KICKALL) - للمالك ميدو الجوهري فقط
            if (cmd === "kickall") {
                if (!isOwner) return await sock.sendMessage(jid, { text: "❌ عذراً! هذا الأمر تدميري ومخصص فقط لمالك البوت (ميدو الجوهري)." });
                if (!isGroup) return await sock.sendMessage(jid, { text: "❌ هذا الأمر يعمل داخل المجموعات فقط!" });
                if (!isBotAdmin) return await sock.sendMessage(jid, { text: "❌ يجب رفع البوت مشرفاً (Admin) لتنفيذ عملية التصفية!" });

                await sock.sendMessage(jid, { text: "⚠️ جاري بدء تصفية المجموعة بالكامل بأمر المالك..." });
                
                for (let participant of participants) {
                    // حماية البوت والمالك من الطرد
                    if (participant.id !== botId && participant.id !== OWNER_NUMBER) {
export const ids = ["BV1xx411c7mD", "BV1Q541167Qg"];
export const videos = ids.map((bvid, i) => ({
  bvid,
  title: `视频 ${i + 1}：办公室里的旅行 <安全标题>`,
  pic: "http://i0.hdslb.com/bilioffice-test-cover",
  owner: { name: "测试UP主", face: "" },
  author: "测试UP主",
  stat: { view: 12345 },
  duration: 92,
}));
export const home = `<!doctype html><meta charset="utf-8"><title>模拟 B站</title><div id="app">${videos.map((v, i) => `<article class="bili-video-card"><a href="/video/${v.bvid}/" title="${v.title.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}">${i === 0 ? `<img data-src="${v.pic}" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width="672" height="378">` : `<picture><source srcset="//i0.hdslb.com/bilioffice-test-cover 1x"><img width="672" height="378"></picture>`}</a></article>`).join("")}</div>`;
export const video = `<!doctype html><meta charset="utf-8"><title>模拟原生视频页</title><div id="app"><div id="bilibili-player"><video controls muted style="width:100%;height:100%"></video></div><bili-comments></bili-comments></div><script>
const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');function draw(){ctx.fillStyle='#172e48';ctx.fillRect(0,0,640,360);ctx.fillStyle='#72dac4';ctx.fillRect(Date.now()/10%550,150,70,70);ctx.fillStyle='#fff';ctx.font='24px sans-serif';ctx.fillText('模拟视频 · Canvas stream',30,70);requestAnimationFrame(draw)}draw();document.querySelector('video').srcObject=canvas.captureStream(25);
const host=document.querySelector('bili-comments');const root=host.attachShadow({mode:'open'});root.innerHTML='<div class="reply-item"><span class="user-name">主评论用户</span><span class="reply-content">真实异步 DOM 评论<img src="https://i0.hdslb.com/bilioffice-test-cover"></span><div class="sub-reply-item"><span class="sub-user-name">回复用户</span><span class="sub-reply-content">楼中楼正文</span></div></div><button>加载更多</button>';
root.querySelector('button').onclick=()=>setTimeout(()=>{const r=document.createElement('div');r.className='reply-item';r.innerHTML='<span class="user-name">新用户</span><span class="reply-content">延迟加载的评论</span>';root.prepend(r)},500);
</script>`;

// A finite local media file exercises real currentTime seeking; Canvas streams cannot seek.
export const seekableVideo = video
  .replace(
    "<video controls muted",
    '<video controls muted src="/bilioffice-seekable.webm"',
  )
  .replace(
    "document.querySelector('video').srcObject=canvas.captureStream(25);",
    "",
  );

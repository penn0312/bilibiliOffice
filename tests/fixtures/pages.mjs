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

export const nativeControlsVideo = seekableVideo
  .replace(
    '<div id="bilibili-player"><video',
    '<div id="bilibili-player"><div class="bpx-player-container"><video',
  )
  .replace(
    "</video></div><bili-comments>",
    '</video><div class="native-hidden-menu">原站隐藏菜单</div></div></div><bili-comments>',
  )
  .replace(
    "<title>模拟原生视频页</title>",
    "<title>模拟原生视频页</title><style>.bpx-player-container{width:100%;height:100%}.native-hidden-menu{visibility:hidden;position:absolute;inset:0;background:red}</style>",
  );

const commentVideoPrefix = video.slice(
  0,
  video.indexOf("const host=document.querySelector('bili-comments')"),
);
const renderAsyncComments = `
window.nativeMoreClicks=0;
const render=()=>{
 const root=host.attachShadow({mode:'open'});
 root.innerHTML='<article class="reply-item"><span class="user-name">异步评论用户</span><div class="reply-content">详情页异步评论正文</div><span class="like-count">12</span><div class="sub-reply-item"><span class="sub-user-name">异步回复用户</span><div class="sub-reply-content">异步楼中楼</div></div></article>';
 if(location.search.includes('restricted') || window.top!==window.self) root.innerHTML+='<div id="limit-mask-tip">登录后查看更多评论</div>';
 const more=document.createElement('button'); more.textContent='加载更多'; more.onclick=()=>{window.nativeMoreClicks++}; root.append(more);
};`;
export const delayedCommentsVideo =
  commentVideoPrefix.replace(
    "<bili-comments></bili-comments>",
    '<div id="commentapp" style="min-height:200px;margin-top:1400px"></div>',
  ) +
  `
setTimeout(()=>{const host=document.createElement('bili-comments');host.style.display='block';document.querySelector('#commentapp').append(host);${renderAsyncComments}render();},900);
</script>`;
export const lazyCommentsVideo =
  commentVideoPrefix.replace(
    "<bili-comments></bili-comments>",
    '<bili-comments style="display:block;min-height:250px;margin-top:1400px"></bili-comments>',
  ) +
  `
const host=document.querySelector('bili-comments');${renderAsyncComments}
const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();setTimeout(render,200)}});observer.observe(host);
</script>`;

// The lazy comment host and finite media share one iframe for seeking regressions.
export const lazySeekableCommentsVideo = lazyCommentsVideo
  .replace(
    "<video controls muted",
    '<video controls muted src="/bilioffice-seekable.webm"',
  )
  .replace(
    "document.querySelector('video').srcObject=canvas.captureStream(25);",
    "",
  );

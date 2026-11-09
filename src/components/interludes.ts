const exchanges = [
  ["孙悦", "评审纪要补好了，待确认的两项我在文档里标黄了。"],
  ["王晨", "收到，我下午联调的时候一起看，结束后在群里同步。"],
  ["林晓雨", "明天的会往后挪半小时，日历邀请已经更新了。"],
  ["陈思远", "可以，我这边没有冲突。演示环境也准备好了。"],
  ["周宁", "这周先把主流程跑通，边界情况我单独整理了一页清单。"],
  ["孙悦", "我补了空状态的说明，页面间距按最新的标注走就好。"],
  ["王晨", "测试环境已经更新，大家有空帮忙过一下筛选和翻页。"],
  ["林晓雨", "刚看了一遍，筛选没有问题，长标题那处我留了个评论。"],
  ["陈思远", "那处收到，今天下班前一起处理。"],
  ["周宁", "周五分享的材料放到知识库了，先看目录，有问题直接在文档里留言。"],
  ["孙悦", "好的，我把设计侧的例子也放进去。"],
  ["王晨", "发布前再过一次清单，确认完我来更新任务状态。"],
] as const;

export function messageTime(index: number) {
  const minute = 9 * 60 + 44 + index;
  return `${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

/** Alternate gaps of two and three unique video cards, including across pages. */
export function interludeAfter(videoCount: number) {
  if (videoCount < 2 || ![0, 2].includes(videoCount % 5)) return null;
  const index = Math.floor(videoCount / 5) * 2 - (videoCount % 5 === 0 ? 1 : 0);
  const [author, text] = exchanges[index % exchanges.length];
  return { author, text, time: messageTime(videoCount - 1) };
}

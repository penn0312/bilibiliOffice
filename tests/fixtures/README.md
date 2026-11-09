`seekable.webm` 是本地生成的 20 秒 VP8 测试图案，无音轨，用于验证真实 HTMLVideoElement.currentTime 定位，不依赖外部视频服务。测试直接使用仓库中的文件，不要求运行环境安装 FFmpeg。

生成命令：

```sh
ffmpeg -f lavfi -i 'testsrc2=size=320x180:rate=15' -t 20 -an -c:v libvpx -b:v 120k -g 15 -deadline realtime tests/fixtures/seekable.webm
```

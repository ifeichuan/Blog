---
tags:
  - Linux
title: Tmux速记
dateCreated: 2025-09-21T22:25:17+08:00
dateModified: 2025-10-18T23:39:00+08:00
isPub: true
---

[提升命令行使用体验──tmux 终端复用 - LUG @ USTC](https://lug.ustc.edu.cn/planet/2025/07/how-to-use-tmux/)

[Tmux 使用教程 - 阮一峰的网络日志](https://www.ruanyifeng.com/blog/2019/10/tmux.html)

[App+1 \| AeroSpace：消除窗口重叠，世界属于平铺 - 少数派](https://sspai.com/post/84935)

> [!note]+ Tmux 是什么?
> Tmux 是一个可以保存终端状态和记录的终端复用器 (**T**erminal **Mu**ltiple**X**er). 可以保存一个终端并在以后重新连接并且显示之前的输出. 并且可以在同一个终端内创建多个窗口 (分屏) ,每个窗口都运行独立的 Shell 进程.

Tmux 的原理: 将终端(Terminal)和会话(Sesstion)进行了分离, 用户可以随时退出(detach)当前会话, 会话会在后台保持运行, 之后用户可以通过 (attach) 重新连接上会话.

# 常用命令
Tmux 有两种操作方式, 一种是通过键盘触发键 `ctrl+b` 一种是直接在终端输入 `tmux` 命令.

- 新建会话: `tmux new -s <sesstion-name>` 默认窗口编号是 0, 之后是 1 以此类推
- 分离会话: `tmux detach` 将当前会话和终端窗口分离 `ctrl + b d`
- 显示会话列表: `tmux ls or tmux list-session` `ctrl + b s`
- 接入会话: `tmux attach -t <session-name> or <number>` 输入名称或编号
- 杀死会话: `tmux kill-session` 参数和上面相同
- 切换会话: `tmux switch` 相同
- 重命名会话: `tmux-rename-session -t 0 <new-name>` `ctrl+b $`

## 窗格操作

Tmux 可以将一个终端窗口(Window)分成多个窗格 (Pane), 每个窗格运行着不同的 `Session` 实例.

- 划分窗格: `tmux split-window <option>` 将窗口划分为上下两个窗格若带上 `-h` 则划分为左右两个 `ctrl+b % 左右划分`, `ctrl+b " 上下划分`
- 修改聚焦的窗格 (移动光标所在窗格): `tmux select-pane -LRDU` 将光标移动到 `左右下上` 窗格 (基于当前位置)
- 交换窗格位置: `tmux swap-pane -LRDU` 将当前窗格移动到 `左右上下` 窗格
	- `Ctrl+b <arrow key>` 光标切换到其他窗格
- `Ctrl+b ;`：光标切换到上一个窗格。
- `Ctrl+b o`：光标切换到下一个窗格。
- `Ctrl+b {`：当前窗格与上一个窗格交换位置。
- `Ctrl+b }`：当前窗格与下一个窗格交换位置。
- `Ctrl+b Ctrl+o`：所有窗格向前移动一个位置，第一个窗格变成最后一个窗格。
- `Ctrl+b Alt+o`：所有窗格向后移动一个位置，最后一个窗格变成第一个窗格。
- `Ctrl+b x`：关闭当前窗格。
- `Ctrl+b !`：将当前窗格拆分为一个独立窗口。
- `Ctrl+b z`：当前窗格全屏显示，再使用一次会变回原来大小。
- `Ctrl+b Ctrl+<arrow key>`：按箭头方向调整窗格大小。
- `Ctrl+b q`：显示窗格编号。
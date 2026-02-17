---
isPub: true
tags:
  - Linux
title: Linux学习
dateCreated: 2025-09-08T15:36:55+08:00
dateModified: 2025-11-04T16:26:22+08:00
---
`-` 短命令可组合
`--` 长命令不可组合

`[当前用户名@主机名 当前路径]$`
`$` 普通用户
`#` root 用户

在 Shell 中 `.` 代表当前目录, 在操作当前目录下的文件时非常好用
-  `cp -i(强制覆盖) /etc/NetworkManager/conf . ` 移动至当前目录


`chmod <number> or <option>` 
- `option`: `[u(user) || g(group) || o(other) || a(all)]+(rwx)`
- `number`: 八进制下的 rwx 权限 (111 = 7 110 = 6) 每一位代表每个组


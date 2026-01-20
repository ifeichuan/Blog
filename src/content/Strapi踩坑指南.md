---
title: Strapi踩坑指南
tags:
  - Nodejs
description: Strapi CMS 实战踩坑记录，深入解析 populate 深层数据、自定义路由、控制器等高级用法
banner: https://images.unsplash.com/photo-1753458198651-4752b7b7960e?q=80&w=1624&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D
dateCreated: 2025-07-14T18:03:48+08:00
dateModified: 2025-10-18T23:39:00+08:00
isPub: true
---

最近接了一个单子 前端已经写好 但是需要一个简单 CMS 来管理数据,最终选择了 Strapi 主要是看中了他 Headless CMS + RestFul API+开源的优势.
接下来简单说一下我遇到坑与难点

## populate 深层数据

比方说我们有这样一个结构

```ts
interface Person{
	name:string,
	age:number,
	components:Components(可以理解为对象)
}
```

那么自动生成的链接就是 `GET /api/person/documentId 和 /api/persons`
在默认情况下返回的数据是**不带`components`的**,也就是下面这样

```json
// /api/persons
[
{
name,
age,
}...
]
```

在官方文档中提供了一个简单办法,那就是 `/api/persons?populte=*`
这样的话就可以获取到所有第二层的数据(就是说非基本数据,官方以层级来解释). 但是这个方法有两个缺点，第一个 URL 不干净了(悲),第二个就是
**只能获取到第二层的数据** 无法处理多层嵌套的情况 比方说，
Strapi 目前提供了 三种`Content-Type`分别是 `集合类型(Collection Types)`,`单个类型(Single Types)`和`组件(Conponents)`.
而基本类型中又有引用(稍后提到)和 Component 组件 这两种类型可以在当前的类型中引用或嵌入一个对应类型的对象,日常开发中可能嵌套多层.
虽然官方也提供了基于上述方法`populate`的扩展 比如`/api/persons?populate[A][populate][underAObjectName]` 但是还是太麻烦了.好在官方是支持自定义处理方法的,

### What is custom handle method?

在`/src/api/类型名/controllers/` 目录下有这样的工厂代码

```ts
import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::overview.overview", {});
```

如果我们想自定义返回的结构与层级,又不想改 url,可以直接在第二个参数里写入对应路由的方法,例如

```ts
import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::overview.overview", {
  async create(ctx, next) {
    let data = await strapi.documents("api::overview.overview").create({
      populate: {
        //这个是引用类型的数据

        records: {
          populate: {
            // 等同于 {populate:*}

            image_url: true,
          },
        },
      },
    });
  },

  async find(ctx, next) {},

  async findOne(ctx, next) {},
});
```

by the way, 媒体库中的图片在返回的时候也是只返回`documentId`,要想直接获得 url 需要加一个 populate

## 自定义路由

这个比较简单.
只需要在 `/api/[自定义名字]/controllers` 和 `/api/[自定义名字]/router`写入对应的

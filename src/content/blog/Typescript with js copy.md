---
title: Typescript with JS
tags:
  - Typescript
  - Javascript
dateCreated: 2025-08-24T03:20:59+08:00
dateModified: 2025-10-18T23:37:42+08:00
banner: https://images.unsplash.com/photo-1583502070955-f195c352ff30?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2783
---

## `for of for in` 区别

## File 和 Bolb 对象的区别

`Blob(Binary Large Object)` 用于表示不可变的, 原始的二进制数据。它可以用来存储视频, 图片, 音频, 基本上一切格式。它提供了一种高效的方式来处理数据, 而不必**全部加载到内存**中。

```ts
let blob: Blob = new Blob(blobParts, options);
```

1. `BlobParts `:一个数组, 包含被放入 Blob 对象中的数据。可以是字符串, `ArrayBuffer`, `TypedArray`, `Blob`.
2. `Options`: 一个可选对象, 可以设置类型（MIME 类型, 也就是 `base64` 的格式）和 endings 换行符.

Blob 对象有以下几个属性

1. `size`: 返回 Blob 对象的大小（Byte）
2. `type`: 返回 Blob 对象的 MIME 类型

Blob 对象提供了许多操作方法

1. `slice（[start],[end],[contentType]）`
   1. 该方法用于从 Blob 中提取一部分数据。常用于大文件分片.
2. `text()`
   1. 将 Blob 内容读取为字符串, 返回 `Promise`. 没想到应用场景啊.
3. `arrayBuffer()`
   1. 读取为 ArrayBuffer 对象, 适合处理非文本数据, 返回 Promise, 解析为 ArrayBuffer 数据

```ts
const blob = new Blob(["Hello, world!"], { type: "text/plain" });
blob.arrayBuffer().then((buffer) => {
  console.log(buffer);
});
```

4. `stream()`
   1. 读取为 `ReadableStream` 返回, 允许以 `流` 的方式处理数据, 适合处理大文件

### Bolb 的使用场景

#### 生成文件下载

你可以通过 Blob 创建文件并通过 `a` 标签来让用户下载文件

```ts
const blob = new Blob(["this is a test file."], { type: "text/plain" });
const url = URL.createObjectURL(blob); // 创建一个 Blob URL
const a = document.createElement("a");
a.href = url;
a.download = "test.txt"; //下载文件名 同时设置为下载链接
a.click();
URL.revokeObjectURL(url); //释放URL对象
```

#### 上传文件

通过生成 `FormData` 对象将 Blob 作为文件上传到服务器

```ts
const formData = new FormData();
formData.append("file", blob, "example.txt"); // key value optionsName
fetch("/upload", {
  method: "POST",
  body: formDta,
}).then((res) => {
  console.log("File uploaded Successfully!");
});
```

#### 读取文件

```ts
const file: File = input.files[0];
const reader = new FileReader();
reader.onload = (e) => {
  const src = e.target.result;
  console.log(src);
};
// 先写onload 防止编译器读取错误.
reader.readAsDataURL(file);
```

### File 和 Blob 的区别

File 是 Blob 的子类, 拥有 Blob 对象的所有方法, 以及其他的元（meta）信息。File 对象常见于 Input, DataTransfer (拖动操作), Clipboard（剪贴板）

## 前端必备的手写

1. 手写 Promise 包括 all, allsettler
2. 手写 EventBus on emit off once
3. 手写 flat 扁平化数组

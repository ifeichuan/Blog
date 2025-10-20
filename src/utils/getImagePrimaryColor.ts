async function getImagePrimaryColor(imageSrc: string) {
  // 获取图片的像素数据
  function getImagePixelData(canvas: HTMLCanvasElement, img: HTMLImageElement) {
    const context = canvas.getContext("2d")!;
    context.drawImage(img, 0, 0);

    // 获取像素数据
    const pixelData = context.getImageData(0, 0, canvas.width, canvas.height)
      .data as any as number[];
    return pixelData;
  }

  // 获取 rgba 像素点的数据和出现的次数并排序
  function getPrimaryColor(pixelData: number[]) {
    const colorList = [];
    const rgba = [] as (number | undefined)[];
    let rgbaStr = "";
    // 分组循环
    for (let i = 0; i < pixelData.length; i += 4) {
      rgba[0] = pixelData[i];
      rgba[1] = pixelData[i + 1];
      rgba[2] = pixelData[i + 2];
      rgba[3] = pixelData[i + 3];

      if (rgba.includes(undefined) || pixelData[i + 3] === 0) {
        continue;
      }

      rgbaStr = rgba.join(",");
      if (rgbaStr in colorList) {
        ++colorList[rgbaStr];
      } else {
        colorList[rgbaStr] = 1;
      }
    }

    const arr = [] as { color: string; count: number }[];
    for (const prop in colorList) {
      arr.push({
        // 如果只获取rgb,则为`rgb(${prop})`
        color: `rgba(${prop})`,
        count: colorList[prop],
      });
    }
    // 数组排序
    arr.sort((a, b) => {
      return b.count - a.count;
    });

    return arr;
  }

  function resolveImage(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const img = new Image(); // 创建img元素
        img.src = imageSrc; // 设置图片源地址
        img.onload = () => {
          resolve(getImagePixelData(canvas, img));
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  return getPrimaryColor(await resolveImage());
}

// 获取得到后的数据的第 0 位
console.log(
  getImagePrimaryColor(
    "https://images.unsplash.com/photo-1754780349763-e3a598db827b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNnx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=60&w=900"
  )
);

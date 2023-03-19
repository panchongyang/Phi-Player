// 获取设备的devicePixelRatio
var dpr = window.devicePixelRatio;

// 获取屏幕可见宽度和高度（CSS像素）
var screenWidth = document.documentElement.clientWidth;
var screenHeight = document.documentElement.clientHeight;

// 计算屏幕真实宽度和高度（物理像素）
export var realWidth = dpr * screenWidth;
export var realHeight = dpr * screenHeight;

export const relativelyNumber = 1;

export const relativelyW = 2048 * relativelyNumber;
export const relativelyH = 1400 * relativelyNumber;



export const width = realHeight * relativelyW / relativelyH;
export const height = realHeight;

export const speedNumber = 7.525;


export const relativelyX = (n: number) => n * width / relativelyW;
export const relativelyY = (n: number) => n * height / relativelyH;
import { height, width } from "./config";

export function rotatePoint(pointX: number, pointY: number, originX: number, originY: number, angle: number) {
    // Convert angle from degrees to radians
    angle = angle * Math.PI / 180.0;

    // Calculate the rotated coordinates
    let rotatedX = Math.cos(angle) * (pointX - originX) - Math.sin(angle) * (pointY - originY) + originX;
    let rotatedY = Math.sin(angle) * (pointX - originX) + Math.cos(angle) * (pointY - originY) + originY;

    // Return the result as an array
    return [rotatedX, rotatedY];
}

export function beatToTime(beat: number[], bpm: { start: number, value: number }[]) {
    if (bpm.length === 1) {
        return beat[0] / bpm[0].value * 1000 * 60 + (beat[1] / beat[2]) * (1 / bpm[0].value * 1000 * 60);
    } else {
        return bpm.reduce((pre, cur, index, bpm) => {
            if((beat[0] + (beat[1] / beat[2])) > cur.start) {
                if(index === bpm.length - 1) {
                    return {
                        value: pre.value + (beat[0] + (beat[1] / beat[2]) - cur.start) / cur.value * 1000 * 60,
                    };
                }
                if((beat[0] + (beat[1] / beat[2])) <= bpm[index + 1].start) {
                    return {
                        value: pre.value + (beat[0] + (beat[1] / beat[2]) - cur.start) / cur.value * 1000 * 60,
                    };
                } else {
                    return {
                        value: pre.value + (bpm[index + 1].start - cur.start) / cur.value * 1000 * 60,
                    };
                }
            } else {
                return pre;
            }

        }, {
            value: 0,
        }).value;
    }

}

// 定义一个函数，求过点（x, y）、角度为d的直线与一个对角端点分别为（0， 0），（1200， 800）的矩形的两个交点
export // 定义一个函数，求过点（x, y）、角度为d的直线与一个对角端点分别为（0， 0），（1200， 800）的矩形的两个交点
    function getIntersections(x: number, y: number, d: number): [number, number][] {
    // 定义一个数组，存放交点坐标
    let intersections: [number, number][] = [];
    // 定义矩形的四条边界线的方程
    let left = (y: number) => 0; // x = 0
    let right = (y: number) => width; // x = 1200
    let top = (x: number) => height; // y = 800
    let bottom = (x: number) => 0; // y = 0
    // 定义过点（x, y）、角度为d的直线的方程
    let line = (xx: number) => y + Math.tan(d * Math.PI / 180) * (xx - x); // y - y1 = tan(d) * (x - x1)

    // 求直线与左边界线的交点，并判断是否在矩形内部
    let leftY = line(0);
    if (leftY >= bottom(0) && leftY <= top(0)) {
        intersections.push([left(leftY), leftY]); // 将交点坐标加入数组
    }

    // 求直线与右边界线的交点，并判断是否在矩形内部
    let rightY = line(width);
    if (rightY >= bottom(width) && rightY <= top(width)) {
        intersections.push([right(rightY), rightY]); // 将交点坐标加入数组
    }

    // 求直线与上边界线的交点，并判断是否在矩形内部
    let topX = (top(x) - y) / Math.tan(d * Math.PI / 180) + x;
    if (topX >= left(top(x)) && topX <= right(top(x))) {
        intersections.push([topX, top(topX)]); // 将交点坐标加入数组
    }

    // 求直线与下边界线的交点，并判断是否在矩形内部
    let bottomX = (bottom(x) - y) / Math.tan(d * Math.PI / 180) + x;
    if (bottomX >= left(bottom(x)) && bottomX <= right(bottom(x))) {
        intersections.push([bottomX, bottom(bottomX)]); // 将交点坐标加入数组
    }

    if (intersections.length !== 2) {
        return [[0, 0], [0, 0]];
    } else {
        return intersections;
    }
}
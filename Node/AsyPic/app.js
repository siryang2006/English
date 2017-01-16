//https://zhuanlan.zhihu.com/p/24730075?refer
var http = require('http');			// http 网路
var cheerio = require('cheerio');	// html 解析
var fs = require("fs");				// 流

var queryHref = "http://www.haha.mx/topic/1/new/"; 	// 设置被查询的目标网址
var querySearch = 1;								// 设置分页位置
var urls = [];

var sumConut = 0;
var reptCount = 0;		// 重复的
var downCount = 0;		// 实际下载的


/**
 * 根据url和参数获取分页内容
 * @param {String}： url
 * @param {int}： serach
 */
function getHtml(href, serach) {
    console.log("Loading " + serach + " pic");
    var pageData = "";
    var req = http.get(href + serach, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            pageData += chunk;
        });

        res.on('end', function () {
            $ = cheerio.load(pageData);
            var html = $(".joke-list-item .joke-main-content a img");

            for (var i = 0; i < html.length; i++) {
                var src = html[i].attribs.src;
                // 筛选部分广告，不是真的段子
                if (src.indexOf("http://image.haha.mx") > -1) {
                    urls.push(html[i].attribs.src)
                }
            }
            // 递归调用
            if (serach < pagemax) {
                getHtml(href, ++serach);
            } else {
                console.log("Get picturs urls Done！");
                sumConut = urls.length;
                console.log("urls Count:" + urls.length);
                console.log("Begin Loading......");
                downImg(urls.shift());
            }
        });
    });
}


/**
 * 下载图片
 * @param {String} imgurl：图片地址
 */
function downImg(imgurl) {
    var narr = imgurl.replace("http://image.haha.mx/", "").split("/")
    // 做一步优化，如果存在文件，则不下载
    var filename = "./upload/topic1/" + narr[0] + narr[1] + narr[2] + "_" + narr[4];
    fs.exists(filename, function (b) {
        if (!b) {
            // 文件不存则进行 下载
            http.get(imgurl.replace("/small/", "/big/"), function (res) {
                var imgData = "";
                //一定要设置response的编码为binary否则会下载下来的图片打不开
                res.setEncoding("binary");
                res.on("data", function (chunk) {
                    imgData += chunk;
                });

                res.on("end", function () {
                    var savePath = "./upload/topic1/" + narr[0] + narr[1] + narr[2] + "_" + narr[4];
                    fs.writeFile(savePath, imgData, "binary", function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(narr[0] + narr[1] + narr[2] + "_" + narr[4]);
                            if (urls.length > 0) {
                                downImg(urls.shift());
                                downCount++;
                                console.log("other count....");
                            }
                        }
                    });
                });
            });
        } else {
            // 统计重复的图片
            console.log("Repeat.");
            reptCount++;
            if (urls.length > 0) {
                downImg(urls.shift());
            }
        }
    });

    if (urls.length <= 0) {
        console.log("down done");
        console.log("reptCount:" + reptCount);
        console.log("downCount:" + downCount);
    }
}

var pagemax = 30;		// 获取到多少页的内容
var startindex = 1;		// 从多少页开始获取

function start() {
    console.log("Begin Urls");
    getHtml(queryHref, startindex);
}

start();
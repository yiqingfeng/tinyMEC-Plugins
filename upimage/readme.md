# 上传/插入图片插件 upimage

## plugin-1.0 传统点击上传

## plugin-2.0 拖拽上传

## 依赖项

- Bootstrap 3
- jQuery1.11
- spin

## 配置项
    tinymce.init({
		upimage: {
            imgCountsUrl: '/images/counts',// 图片总数接口
            imgListUrl: '/images/list',// 图片列表接口
            upImgsUrl: '/index/upimage',// 图片上传接口
        }
	});
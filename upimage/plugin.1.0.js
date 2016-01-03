/**
 * plugin.js
 * author: mengxuan
 */

tinymce.PluginManager.add('upimage', function(editor) {
	var defaultConfig = {
		selectors: {
			root    : '#mec-upimage',// 根节点
			btn     : '.j-btn',// 提交按钮
			imgList : '.j-imgList',// 图片列表
			imgPager: '.j-page',// 图片分页器
			upFiles : '.j-upimgs',// 上传图片
			showUp  : '.j-showup'// 显示上传图片
		},
		imgCountsUrl: '/images/counts',// 图片总数接口
		imgListUrl: '/images/list',// 图片列表接口
		upImgsUrl: '/index/upimage',// 图片上传接口
		pages: 0,// 图片页数，非零时表示展示指定数量的图片
		beforePage: 1,// 前一页 
		curtPage: 1,// 当前页

		counts: 8// 每页图片数量
	}
	// AJAX等待
	var opts = {
		lines: 13 // The number of lines to draw
		, length: 28 // The length of each line
		, width: 2 // The line thickness
		, radius: 77 // The radius of the inner circle
		, scale: 1.5 // Scales overall size of the spinner
		, corners: 0.4 // Corner roundness (0..1)
		, color: '#000' // #rgb or #rrggbb or array of colors
		, opacity: 0 // Opacity of the lines
		, rotate: 0 // The rotation offset
		, direction: 1 // 1: clockwise, -1: counterclockwise
		, speed: 1 // Rounds per second
		, trail: 59 // Afterglow percentage
		, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
		, zIndex: 2e9 // The z-index (defaults to 2000000000)
		, className: 'spinner' // The CSS class to assign to the spinner
		, top: '50%' // Top position relative to parent
		, left: '50%' // Left position relative to parent
		, shadow: false // Whether to render a shadow
		, hwaccel: false // Whether to use hardware acceleration
		, position: 'absolute' // Element positioning
	}
	var spinner = new Spinner().spin(),
		$spinner = $(spinner.el);
	function getConfig(){
		var upImage = editor.settings.upimage,
			config = {};
		if (!upImage) return defaultConfig;
		config.imgCountsUrl = upImage.imgCountsUrl ? upImage.imgCountsUrl : defaultConfig.imgCountsUrl;
		config.imgListUrl   = upImage.imgListUrl ? upImage.imgListUrl : defaultConfig.imgListUrl;
		config.upImgsUrl    = upImage.upImgsUrl ? upImage.upImgsUrl : defaultConfig.upImgsUrl;
		config.pages        = upImage.pages ? upImage.pages : defaultConfig.pages;
		config.beforePage   = upImage.beforePage ? upImage.beforePage : defaultConfig.beforePage;
		config.curtPage     = upImage.curtPage ? upImage.curtPage : defaultConfig.curtPage;
		config.selectors    = upImage.selectors ? upImage.selectors : defaultConfig.selectors;
		// 获取选择器
		config.selectors.root     = config.selectors.root ? config.selectors.root : defaultConfig.selectors.root;
		config.selectors.btn      = config.selectors.btn ? config.selectors.btn : defaultConfig.selectors.btn;
		config.selectors.imgList  = config.selectors.imgList ? config.selectors.imgList : defaultConfig.selectors.imgList;
		config.selectors.imgPager = config.selectors.imgPager ? config.selectors.imgPager : defaultConfig.selectors.imgPager;
		config.selectors.upFiles  = config.selectors.upFiles ? config.selectors.upFiles : defaultConfig.selectors.upFiles;
		config.selectors.showUp   = config.selectors.showUp ? config.selectors.showUp : defaultConfig.selectors.showUp;
		return config;
	}
	function showMsg($root, type, msg){
		$showMsg = $('<div class="showmsg alert alert-' + type + '">' + msg + '</div>');
		$root.append($showMsg);
		setTimeout(function(){
			$showMsg.remove();
		}, 3000);
	}
	function showDialog(){
		var config = getConfig(),
			$root = $(config.selectors.root);
		$root.modal();
		initial($root, config);
		// 初始化所有
		function initial($root, config){
			initList($root, config);
			initImgPaper($root, config);
			initUp($root, config);
			initSubmit($root, config);
		}
		// 初始化图片库
		function initList($root, config){
			var $imgList = $root.find(config.selectors.imgList);
			imglistRender($imgList, config.imgListUrl, config.curtPage);
			// 图片选择
			$imgList.unbind();
			$imgList.bind('click', function(event){
				var target = event.target;
				var that = event.currentTarget;
				function getLi(elem){
					while(elem.nodeName.toLowerCase() != 'ul'){
						if (elem.nodeName.toLowerCase() == 'li') {
							return elem;
						}
						elem = elem.parentNode;
					}
					return;
				}
				if (target.nodeName.toLowerCase() != 'img') return;
				var active = getLi(target);
				if (active) {
					$(active).toggleClass('active');
				};
			});
		}
		// 初始化图片分页器
		function initImgPaper($root, config){
			var $papers  = $root.find(config.selectors.imgPager),
				$lists   = $root.find(config.selectors.imgList);
				imgPaperRender($papers, $lists, config);
		}
		// 初始化文件上传
		function initUp($root, config){
			var $upFiles = $root.find(config.selectors.upFiles),
				$files = $root.find('#art_file_upload'),
				$showUp = $root.find(config.selectors.showUp),
				beforeFile = $files.get(0).files;
			$upFiles.unbind();
			$upFiles.bind('click', function(){
				var files = $files.get(0).files;
				if (files.length && files != beforeFile) {
					beforeFile = files;
					handleUpFiles(files, $root, config);
				}else {
					showMsg($root, 'warning', '请选择一张图片！');
				};
			});
			$showUp.empty();
			$showUp.unbind();
			$showUp.bind('click', function(event){
				console.log(1);
				var target = event.target;
				var that = event.currentTarget;
				function getLi(elem){
					while(elem.nodeName.toLowerCase() != 'ul'){
						if (elem.nodeName.toLowerCase() == 'li') {
							return elem;
						}
						elem = elem.parentNode;
					}
					return;
				}
				if (target.nodeName.toLowerCase() != 'img') return;
				var active = getLi(target);
				if (active) {
					$(active).toggleClass('active');
				};
			});
			function handleUpFiles(files, $root, config){
				// 检查文件类型和大小
				for(var i=0,length=files.length; i<length; i++){
			        if (!files[i].type.match(/image*/) || files[i].size / 1024 / 1024 > 2) {
			            var warning = '';
			            if (!files[i].type.match(/image*/)) 
			                warning = "请上传图片";
			            else
			                warning = "文件大小超过2M";
			            showMsg($root, 'warning', '所选文件太大，请重新选择！');
			            return false;
			        }
			    }
			    var fd = new FormData();
				$.each(files, function(index, item){
					fd.append('file'+index, item);
				});
				var pane = $root.find('.tab-pane.active');
				$.ajax({
					url: config.upImgsUrl,
					type: 'POST',
					data: fd,
					cache: false,
					contentType: false,
					processData: false,
					beforeSend: function(){
						$root.find('#upImage').append($spinner);
					},
					success: function (data) {
						$('div.spinner').remove();
						data = $.parseJSON(data);
						if (data.code == 1) {
							showMsg($root, 'success', '图片上传成功！');
							var images = '';
							$.each(data.files, function(index, item){
								images += '<li><img src="' + item.url + '" class="img-thumbnail"></li>';
							});
							$showUp.append(images);
						}else {
							showMsg($root, 'danger', data.msg);
						}
					}
				});
			}
		}
	}
	// 图片列表渲染
	function imglistRender($lists, url, curtPage, length){
		length = length ? length : 8;
		$.ajax({
			url: url,
			dataType: 'json',
			data: {
				page: curtPage,
				counts: length
			},
			beforeSend: function(){
				$lists.parent().append($spinner);
			},
			success: function(data){
				$('div.spinner').remove();
				var images = '';
				$.each(data, function(index, item){
					images += '<li><img src="' + item.url + '" class="img-thumbnail"></li>';
				});
				$lists.empty();
				$lists.append(images);
			}
		});
	}
	// 图片分页器渲染
	function imgPaperRender($papers, $lists, config){
		var pages        = config.pages,
			counts       = config.counts || 8,
			beforePage   = config.beforePage,
			curtPage     = config.curtPage,
			imgListUrl   = config.imgListUrl,
			imgCountsUrl = config.imgCountsUrl;
		// 生成新分页器
		function setTemplate($papers, pages, curtPage){
			imglistRender($lists, imgListUrl, curtPage);// 渲染图片列表
			// 前一页
			if (curtPage == 1) {
				var paper = '<li class="disabled"><a aria-label="Previous"><span>&laquo;</span></a></li>';
			}else {
				var paper = '<li><a aria-label="Previous"><span>&laquo;</span></a></li>';
			};
			// 中间页
			if (pages < 9) {
				for(var i = 1; i <= pages; i++){
					if (i == curtPage) {
						paper += '<li class="active"><a role="number">' + i + '</a></li>';
					}else {
						paper += '<li><a role="number">' + i + '</a></li>';
					};
				}
			}else if (curtPage > 4) {
				paper += '<li><a role="number">1</a></li>' + '<li><a>...</a></li>';
				for(var i = curtPage - 2, l = curtPage + 2; i <= l; i++){
					if (i == curtPage) {
						paper += '<li class="active"><a role="number">' + i + '</a></li>';
					}else {
						paper += '<li><a role="number">' + i + '</a></li>';
					};
				}
				paper += '<li><a>...</a></li>';
			}else {
				for(var i = 1; i <= 7; i++){
					if (i == curtPage) {
						paper += '<li class="active"><a role="number">' + i + '</a></li>';
					}else {
						paper += '<li><a role="number">' + i + '</a></li>';
					};
				}
				paper += '<li><a>...</a></li>';
			}
			// 后一页
			if (curtPage == pages) {
				paper += '<li class="disabled"><a aria-label="Next"><span>&raquo;</span></a></li>';
			}else {
				paper += '<li><a aria-label="Next"><span>&raquo;</span></a></li>';
			};
			$papers.empty();
			$papers.append(paper);
		}
		
		if (pages) {
			setTemplate($papers, pages, curtPage);
		}else {
			$.get(imgCountsUrl, function(data){
				config.pages = Math.ceil(data/counts);
				pages = config.pages;
				setTemplate($papers, pages, curtPage);
			});
		};
		$papers.bind('click', function(event){
			var $target = $(event.target),
				flag = $target.attr('role');
			if (!flag) {
				var label = $target.attr('aria-label') || $target.parent().attr('aria-label');
				if (label) {
					if (label.slice(0, 1) == 'P') {
						if (curtPage != 1) {
							config.curtPage = curtPage - 1;
						};
					}else {
						if (curtPage != pages) {
							config.curtPage = curtPage + 1;
						};
					};
					curtPage = config.curtPage;
					setTemplate($papers, pages, curtPage);
				};
				return;
			}
			var page = parseInt($target.text());
			if (page == curtPage) return;
			config.curtPage = page;
			curtPage = config.curtPage;
			setTemplate($papers, pages, curtPage);
		});
	}

	function initSubmit($root, config){
		var $btn = $root.find(config.selectors.btn);
		$btn.unbind();
		$btn.bind('click', function(){
			var $pane = $root.find('.tab-pane.active'),
				$images = $pane.find('.imagelists .active img');
			if (!$images.length) {
				showMsg($root, 'danger', '请先选择一张图片再确认！');
				return;
			};
			var res = '';
			$.each($images, function(index, item){
				var $item = $(item);
				res += '<p><img src="' + $item.attr('src') + '" width="100%"></p>';
			});
			editor.insertContent(res);
			$root.modal('hide');
		});
	}
	
	var upImageModal = 
		'<div class="modal fade m-upimage" id="mec-upimage" tabindex="-1" role="dialog">' +
		    '<div class="modal-dialog modal-lg" role="document">' +
		        '<div class="modal-content">' +
		            '<div class="modal-header">' +
		                '<button class="close" data-dismiss="modal" aria-label="Close">' +
		                    '<sapn aria-hidden="true">&times;</sapn>' +
		                '</button>' +
		                '<h4 class="modal-title">添加图片</h4>' +
		            '</div>' +
		            '<div class="modal-body">' +
		                '<div class="container-fluid">' +
		                    '<ul class="nav nav-tabs" role="tablist">' +
		                        '<li role="presentation"><a href="#upImage" aria-controls="upImage" role="tab" data-toggle="tab">上传</a></li>' +
		                        '<li role="presentation" class="active"><a href="#images" aria-controls="images" role="tab" data-toggle="tab">图片库</a></li>' +
		                    '</ul>' +
		                    '<div class="tab-content image-content">' +
		                        '<div role="tabpanel" class="tab-pane" id="upImage">' +
		                            '<div class="upfiles clearFix">' +
		                                '<div class="col-sm-3 col-sm-offset-4">' +
		                                    '<input type="file" id="art_file_upload" multiple>' +
		                                '</div>' +
		                                '<div class="col-sm-2">' +
		                                    '<button type="button" class="btn btn-primary btn-xs j-upimgs">上传</button>' +
		                                '</div>' +
		                            '</div>' +
		                            '<ul class="imagelists clearFix j-showup"></ul>' +
		                        '</div>' +
		                        '<div role="tabpanel" class="tab-pane active" id="images">' +
		                            '<div>' +
		                                '<ul class="imagelists clearFix j-images j-imgList"></ul>' +
		                                '<nav class="image-page"><ul class="pagination j-page"></ul></nav>' +
		                            '</div>' +
		                        '</div>' +
		                    '</div>' +
		                '</div>' +
		            '</div>' +
		            '<div class="modal-footer">' +
		                '<button class="btn btn-default" data-dismiss="modal">关闭</button>' +
		                '<button class="btn btn-primary j-btn">确认</button>' +
		            '</div>' +
		        '</div>' +
		    '</div>' +
		'</div>';
	$(document.body).append(upImageModal);

	editor.addCommand("mceUpimageEditor", showDialog);

	editor.addButton('upimage', {
		icon: 'image',
		tooltip: '插入图片',
		onclick: showDialog
	});

	editor.addMenuItem('upimage', {
		icon: 'image',
		text: '插入图片',
		context: 'insert',
		onclick: showDialog
	});
});
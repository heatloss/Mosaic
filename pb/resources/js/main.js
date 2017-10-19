function init() {
	var mosaicButton = document.querySelector(".cube.depth");
	var mosaicPanel = document.querySelector(".panel.paneltype-nav");
	mosaicButton.addEventListener("click", toggleMosaic);
	
	function toggleMosaic(e) {
		document.body.classList.toggle('mosaic-active');
		mosaicPanel.classList.toggle('show');
	}
	
}

document.addEventListener("DOMContentLoaded", init);
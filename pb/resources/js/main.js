function init() {
	var mosaicButton = document.querySelector(".mosaicToggle.for-main-nav");
	var mosaicCube = document.querySelector(".cube.depth");
	var mosaicPanel = document.querySelector(".panel.paneltype-nav");
	mosaicButton.addEventListener("click", toggleMosaic);
	mosaicCards = ["news","trending","chronological"]

	window.addEventListener('snap', snapHandler);
	
	function toggleMosaic(e) {
		document.body.classList.toggle('mosaic-active');
		mosaicPanel.classList.toggle('show');
	}
	
	function snapHandler(e) {
		var snapIndex = e.customArg;
		console.log(mosaicCards[snapIndex]);
		
		mosaicButton.classList.remove("news","trending","chronological");
		mosaicButton.classList.add(mosaicCards[snapIndex]);
		
		mosaicCube.querySelector(".pane.front").classList.remove("news","trending","chronological");
		mosaicCube.querySelector(".pane.front").classList.add(mosaicCards[snapIndex]);
		var prevIcon = mosaicCards[snapIndex - 1] || "null";
		var nextIcon = mosaicCards[snapIndex + 1] || "null";
		mosaicCube.querySelector(".pane.left").classList.remove("null", "news","trending","chronological");
		mosaicCube.querySelector(".pane.left").classList.add(prevIcon);
		mosaicCube.querySelector(".pane.right").classList.remove("null","news","trending","chronological");
		mosaicCube.querySelector(".pane.right").classList.add(nextIcon);
	}

	
}

document.addEventListener("DOMContentLoaded", init);


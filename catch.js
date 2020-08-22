const BOARD_SIZE = 1000;

document.addEventListener('DOMContentLoaded', function() {
	var canvas = document.getElementById("canvas"),
		context = canvas.getContext("2d"),
		size = canvas.width = canvas.height = Math.min(window.innerWidth, window.innerHeight),
		mouseX = mouseY = 0,
		frameCount,
		settings = {"chaser": "mouse",
								"runner": "dodge"};

	context.translate(size/2, size/2);
	context.scale(size/BOARD_SIZE, size/BOARD_SIZE);

	var boundary = new BoundaryRamp(-BOARD_SIZE/2, BOARD_SIZE/2, BOARD_SIZE/2, -BOARD_SIZE/2,
									BOARD_SIZE*.2, .05);
	var chaser, runner,
			chaserModel = new Model(),
			runnerModel = new Model();

	run();

	function run() {
		init();
		render();
	}

	function init() {
		frameCount = 0;
		chaser = new Player([random(-BOARD_SIZE/3, BOARD_SIZE/3), random(-BOARD_SIZE/3, BOARD_SIZE/3)], [random(-2,2), random(-2,2)], .1, 0, "#ff0000");
		runner = new Player([random(-BOARD_SIZE/3, BOARD_SIZE/3), random(-BOARD_SIZE/3, BOARD_SIZE/3)], [random(-2,2), random(-2,2)], .1, 0, "#0000ff");
	}

	function render() {
		context.clearRect(-BOARD_SIZE/2, -BOARD_SIZE/2, BOARD_SIZE, BOARD_SIZE);
		boundary.draw(context);
		chaser.draw(context);
		runner.draw(context);

		if (doChaseLogic(runner, chaser)) {
			alert("Gotcha!");
			run();
			return;
		}

		if(frameCount % 15 == 0) {
			chaser.recordHistory();
			runner.recordHistory();
		}
		frameCount++;
		requestAnimationFrame(render);
	}

	function doChaseLogic(runner, chaser) {
		if(settings["chaser"] == "automatic") {
			var prediction = chaserModel.predict(exportModelData(chaser, runner));
			chaser.setHeading(prediction[1]*Math.PI);
			chaser.accelerate(prediction[0]);
		} else {
			if(settings["chaser"] == "chase")
				chaser.setHeadingTowards(...runner.position);
			else if(settings["chaser"] == "mouse")
				chaser.setHeadingTowards(mouseX, mouseY);
			chaser.accelerate(1);
		}
		chaser.applyRamp(boundary);

		if(settings["runner"] == "automatic") {
			var prediction = runnerModel.predict(exportModelData(runner, chaser));
			chaser.setHeading(prediction[1]*Math.PI);
			chaser.accelerate(prediction[0]);
		} else {
			if(settings["runner"] == "dodge") {
				runner.setHeadingTowards(
					- chaser.position[1] + runner.position[1] + runner.position[0],
					+ chaser.position[0] - runner.position[0] + runner.position[1]);
			} else if(settings["runner"] == "run") {
				runner.setHeadingTowards(
					- chaser.position[0] + 2*runner.position[0],
					- chaser.position[1] + 2*runner.position[1]);
			}
			runner.accelerate(1);
		}
		runner.applyRamp(boundary);

		chaser.update();
		runner.update();

		var dist = Math.sqrt((chaser.position[0]-runner.position[0])**2+(chaser.position[1]-runner.position[1])**2);
		if(dist < BOARD_SIZE*.02)
			return true;
		return false;
	}

	function exportModelData(player1, player2) {
		return player1.export().concat(player2.export());
	}

	function trainModels() {
		var batchSize = 5,
				maxSteps = 30*30;
		for(var i=0; i<batchSize; i++) {
			init();
			for(var step=0; step<maxSteps; step++) {
				doChaseLogic();
			}
		}
	}

	document.body.addEventListener("mousemove", function(event) {
		mouseX = translate(event.clientX);
		mouseY = translate(event.clientY);
	});

	function translate(coordinate) {
		return coordinate / size * BOARD_SIZE - BOARD_SIZE/2;
	}

	function random(lower, upper) {
		return Math.random()*(upper-lower)+lower;
	}

});

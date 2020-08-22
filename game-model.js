class Player {
	/*
	position is a vector of the current position
	speed is a vector of the current speed per frame
	strength is the possible acceleration in speed per frame
	heading is an angle in radians
	color has to be 6-digit hex for history to work
	*/
	constructor(position, speed, strength, heading, color = "#000000") {
		this.position = position;
		this.speed = speed;
		this.strength = strength;
		this.heading = heading;
		this.dragCoeff = 0.005;
		this.color = color;

		this.histori = Array(10);
	}

	setHeadingTowards(x, y) {
		var dx = x - this.position[0];
		var dy = y - this.position[1];
		this.heading = Math.atan2(dy, dx);
	}

	setHeading(heading) {
		this.heading = heading;
	}

	accelerate(rate) {
		// add drag proportional to v**2
		var speed = Math.sqrt(this.speed[0]**2 + this.speed[1]**2);
		this.speed[0] -= this.dragCoeff * speed * this.speed[0];
		this.speed[1] -= this.dragCoeff * speed * this.speed[1];

		if(Math.abs(rate) > 1)
			rate /= Math.abs(rate);

		var accX = Math.cos(this.heading) * this.strength * rate;
		var accY = Math.sin(this.heading) * this.strength * rate;
		this.speed[0] += accX;
		this.speed[1] += accY;
	}

	applyRamp(ramp) {
		var acc = ramp.acceleration(...this.position);
		this.speed[0] += acc[0];
		this.speed[1] += acc[1];
	}

	update() {
		this.position[0] += this.speed[0];
		this.position[1] += this.speed[1];
	}

	recordHistory() {
		this.histori.shift();
		this.histori.push(new Player(Array.from(this.position), Array.from(this.speed), this.strength, this.heading, this.color));
	}

	export() {
		return [
			2 * this.position[0] / BOARD_SIZE,
			2 * this.position[1] / BOARD_SIZE,
			this.speed[0] / 5,
			this.speed[1] / 5
		];
	}

	draw(context2d) {
		this.drawArrow(context2d);
		this.drawHistory(context2d);
	}

	drawArrow(context2d, color = this.color) {
		context2d.save();
		context2d.translate(this.position[0], this.position[1]);
		context2d.rotate(this.heading);

		var scale = .01;
		context2d.strokeStyle = color;
		context2d.beginPath();
		context2d.moveTo(-BOARD_SIZE*2*scale, 0);
		context2d.lineTo(0, 0);
		context2d.moveTo(0, 0);
		context2d.lineTo(-BOARD_SIZE*scale, BOARD_SIZE*scale);
		context2d.moveTo(0, 0);
		context2d.lineTo(-BOARD_SIZE*scale, -BOARD_SIZE*scale);
		context2d.stroke();

		context2d.restore();
	}

	drawHistory(context2d) {
		for(var i=0; i<this.histori.length; i++) {
			var transparency = "" + Math.round(5*i/this.histori.length)
			var color = this.color + transparency + transparency
			if(this.histori[i] != null)
				this.histori[i].drawArrow(context2d, color);
		}
	}
}

class BoundaryRamp {
	constructor(topp, right, bottom, left, width, strength) {
		this.topp = topp;
		this.right = right;
		this.bottom = bottom;
		this.left = left;
		this.width = width;
		this.strength = strength;
		this.maxStrength = width/30;
		this.colors = {"outside": "#fdb",
						"middle": "#fed",
						"inside": "white"};
	}

	// calculate the acceleration by distance to the edge
	acceleration(x, y) {
		return [this.slope(x - this.left) - this.slope(this.right - x),
				this.slope(y - this.topp) - this.slope(this.bottom - y)];
	}

	// model how "steep" the ramp is
	slope(delta) {
		if(delta > this.width)
			return 0;
		if(delta <= 0) {
			return this.maxStrength;
		}
		return Math.min(this.maxStrength, this.strength*(this.width/delta - 1));
	}

	draw(context2d) {
		this.prepareLinearGradient(context2d, this.left, this.topp, this.left + this.width, this.topp);
		context2d.fillRect(this.left, this.topp, this.width, this.bottom - this.topp);

		this.prepareLinearGradient(context2d, this.right, this.topp, this.right-this.width, this.topp);
		context2d.fillRect(this.right, this.topp, -this.width, this.bottom - this.topp);

		this.prepareLinearGradient(context2d, this.left, this.topp, this.left, this.topp+this.width);
		context2d.fillRect(this.left, this.topp, this.right - this.left, this.width);

		this.prepareLinearGradient(context2d, this.left, this.bottom, this.left, this.bottom - this.width);
		context2d.fillRect(this.left, this.bottom, this.right - this.left, - this.width);

		this.prepareRaidalGradient(context2d, this.left + this.width, this.topp + this.width);
		context2d.fillRect(this.left, this.topp, this.width, this.width);

		this.prepareRaidalGradient(context2d, this.left + this.width, this.bottom - this.width);
		context2d.fillRect(this.left, this.bottom, this.width, - this.width);

		this.prepareRaidalGradient(context2d, this.right - this.width, this.topp + this.width);
		context2d.fillRect(this.right, this.topp, - this.width, this.width);

		this.prepareRaidalGradient(context2d, this.right - this.width, this.bottom - this.width);
		context2d.fillRect(this.right, this.bottom, - this.width, - this.width);
	}

	prepareLinearGradient(context2d, x0, y0, x1, y1) {
		var grd = context2d.createLinearGradient(x0, y0, x1, y1);
		grd.addColorStop(0, this.colors["outside"]);
		grd.addColorStop(.25, this.colors["middle"]);
		grd.addColorStop(1, this.colors["inside"]);
		context2d.fillStyle = grd;
	}

	prepareRaidalGradient(context2d, centerX, centerY) {
		var grd = context2d.createRadialGradient(centerX, centerY, 0,
											 centerX, centerY, this.width*Math.sqrt(2));
		grd.addColorStop(1, this.colors["outside"]);
		grd.addColorStop(0.5*Math.sqrt(2), this.colors["outside"]);
		grd.addColorStop(0.375*Math.sqrt(2), this.colors["middle"]);
		grd.addColorStop(0, this.colors["inside"]);
		context2d.fillStyle = grd;
	}
}

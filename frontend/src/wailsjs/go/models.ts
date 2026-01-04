export namespace main {
	
	export class ColorResult {
	    r: number;
	    g: number;
	    b: number;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new ColorResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.r = source["r"];
	        this.g = source["g"];
	        this.b = source["b"];
	        this.error = source["error"];
	    }
	}

}


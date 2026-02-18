export namespace main {
	
	export class CDN {
	    Resources: number;
	    Sounds: number;
	    ServerApi: number;
	
	    static createFrom(source: any = {}) {
	        return new CDN(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Resources = source["Resources"];
	        this.Sounds = source["Sounds"];
	        this.ServerApi = source["ServerApi"];
	    }
	}
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
	export class FileInfo {
	    Path: string;
	    Size: number;
	    Modified: number;
	    Type: string;
	    Hash: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.Size = source["Size"];
	        this.Modified = source["Modified"];
	        this.Type = source["Type"];
	        this.Hash = source["Hash"];
	    }
	}
	export class ComparisonResult {
	    MissingFiles: FileInfo[];
	    ModifiedFiles: FileInfo[];
	    CorrectFiles: FileInfo[];
	    DownloadFiles: FileInfo[];
	    TotalJSONFiles: number;
	    TotalLocalFiles: number;
	
	    static createFrom(source: any = {}) {
	        return new ComparisonResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.MissingFiles = this.convertValues(source["MissingFiles"], FileInfo);
	        this.ModifiedFiles = this.convertValues(source["ModifiedFiles"], FileInfo);
	        this.CorrectFiles = this.convertValues(source["CorrectFiles"], FileInfo);
	        this.DownloadFiles = this.convertValues(source["DownloadFiles"], FileInfo);
	        this.TotalJSONFiles = source["TotalJSONFiles"];
	        this.TotalLocalFiles = source["TotalLocalFiles"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class StartCfg {
	    id: number;
	    name: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new StartCfg(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.path = source["path"];
	    }
	}
	export class Launcher {
	    SelectedStyle: number;
	    AutoStyle: boolean;
	    ShowForegroundImage: boolean;
	    ShowBackgroundImage: boolean;
	    CustomForegroundImage: string;
	    CustomBackgroundColor: string;
	    CustomBackgroundImage: string;
	    onlyOneWindow: boolean;
	    AutoCDN: boolean;
	    CDN: CDN;
	
	    static createFrom(source: any = {}) {
	        return new Launcher(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.SelectedStyle = source["SelectedStyle"];
	        this.AutoStyle = source["AutoStyle"];
	        this.ShowForegroundImage = source["ShowForegroundImage"];
	        this.ShowBackgroundImage = source["ShowBackgroundImage"];
	        this.CustomForegroundImage = source["CustomForegroundImage"];
	        this.CustomBackgroundColor = source["CustomBackgroundColor"];
	        this.CustomBackgroundImage = source["CustomBackgroundImage"];
	        this.onlyOneWindow = source["onlyOneWindow"];
	        this.AutoCDN = source["AutoCDN"];
	        this.CDN = this.convertValues(source["CDN"], CDN);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Params {
	    wideScreen: boolean;
	    autoLogin: boolean;
	    preload: boolean;
	    windowed: boolean;
	    seasons: boolean;
	    graphics: boolean;
	    shitPc: boolean;
	    cefDirtyRects: boolean;
	    authCef: boolean;
	    grass: boolean;
	    oldResolution: boolean;
	    hdrResolution: boolean;
	    modern_scale: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Params(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.wideScreen = source["wideScreen"];
	        this.autoLogin = source["autoLogin"];
	        this.preload = source["preload"];
	        this.windowed = source["windowed"];
	        this.seasons = source["seasons"];
	        this.graphics = source["graphics"];
	        this.shitPc = source["shitPc"];
	        this.cefDirtyRects = source["cefDirtyRects"];
	        this.authCef = source["authCef"];
	        this.grass = source["grass"];
	        this.oldResolution = source["oldResolution"];
	        this.hdrResolution = source["hdrResolution"];
	        this.modern_scale = source["modern_scale"];
	    }
	}
	export class Config {
	    name: string;
	    path: string;
	    memory: number;
	    selectedServer: number;
	    params: Params;
	    Launcher: Launcher;
	    savedStartCfgs: StartCfg[];
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.memory = source["memory"];
	        this.selectedServer = source["selectedServer"];
	        this.params = this.convertValues(source["params"], Params);
	        this.Launcher = this.convertValues(source["Launcher"], Launcher);
	        this.savedStartCfgs = this.convertValues(source["savedStartCfgs"], StartCfg);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	

}


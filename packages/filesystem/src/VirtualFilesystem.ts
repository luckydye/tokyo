let fs, path, logFile;

const env = typeof Buffer != "undefined" ? "node" : "browser";

export class VirtualFileSystem {
  static async indexFileTree(dir, filelist) {
    filelist = filelist || {};

    fs = fs || (await import(/* webpackIgnore: true */ "fs"));
    path = path || (await import(/* webpackIgnore: true */ "path"));

    if (!logFile) {
      if (fs.existsSync("filesystem.log")) {
        fs.unlinkSync("filesystem.log");
      }
      logFile = fs.createWriteStream("filesystem.log");
    }

    const files = fs.readdirSync(dir);

    files.forEach(async (file) => {
      if (fs.statSync(dir + "/" + file).isDirectory()) {
        filelist = await this.indexFileTree(dir + "/" + file, filelist);
      } else {
        const dirPath = dir.split(/\/|\\/g).slice(1);
        const fileKey = dirPath.join("/").toLocaleLowerCase() + "/" + file.toLocaleLowerCase();

        if (logFile) {
          logFile.write(fileKey + "\n");
        }

        filelist[fileKey] = {
          file: dir + "/" + file,
          async arrayBuffer() {
            return new Promise((resolve, reject) => {
              fs.readFile(dir + "/" + file, (err, data) => {
                if (err) {
                  reject(new Error("Error loading file: " + err));
                } else {
                  resolve(data);
                }
              });
            });
          },
        };
      }
    });

    return filelist;
  }

  constructor(root = "csgo/") {
    this.root = root;
    this.zip = null;
    this.vpkfile = null;
    this.indexed = false;
    this.fileRegistry = {};
  }

  setRoot(root) {
    this.root = root;
  }

  getRoot() {
    return this.root;
  }

  async attatchZip(pakfileBuffer) {
    this.zip = await Zip.loadAsync(pakfileBuffer);

    const pakfile = this.zip;
    const entries = Object.keys(pakfile.files);

    for (let entry of entries) {
      if (logFile) {
        logFile.write(entry + "\n");
      }

      this.fileRegistry[entry.toLocaleLowerCase()] = {
        file: entry,
        async arrayBuffer() {
          return (await pakfile.files[entry].async("uint8array")).buffer;
        },
      };
    }
  }

  getTree() {
    const files = Object.keys(this.fileRegistry);

    const tree = {
      name: "root",
      type: "root",
      children: [],
    };

    const enterRecursive = (pathArray, currentLocation, currentPath = []) => {
      const locationName = pathArray.splice(0, 1)[0];
      currentPath.push(locationName);

      let location = currentLocation.children.find((child) => child.name == locationName);

      if (location == undefined) {
        location = {
          name: locationName,
          path: currentPath.join("/"),
          type: locationName.split(".").length === 1 ? "folder" : null,
          children: [],
        };

        currentLocation.children.push(location);

        // sort alphabeticly
        currentLocation.children.sort((a, b) => {
          return a.name < b.name ? 1 : -1;
        });

        // sort for folder and types
        currentLocation.children.sort((a, b) => {
          return b.type == "folder" && a.type !== b.type ? 1 : -1;
        });
      }

      if (pathArray.length >= 1) {
        enterRecursive(pathArray, location, currentPath);
      }
    };

    for (let file of files) {
      const pathArray = file.split(/\//g).filter((p) => p != " ");
      enterRecursive(pathArray, tree);
    }

    return tree;
  }

  getFile(resource) {
    resource = resource.replace(/\/|\\/g, "/").toLocaleLowerCase();

    return new Promise(async (resolve, reject) => {
      if (this.fileRegistry.hasOwnProperty(resource)) {
        return resolve(this.fileRegistry[resource]);
      } else {
        Object.keys(this.fileRegistry).find((entry) => {
          if (entry.match(resource)) {
            return resolve(this.fileRegistry[entry]);
          }
        });
      }

      // index if not yet indexed
      if (!this.indexed && env === "node") {
        this.fileRegistry = Object.assign(
          await VirtualFileSystem.indexFileTree(this.root),
          this.fileRegistry
        );
        this.indexed = true;

        const file = await this.getFile(resource);
        if (file) {
          resolve(file);
        }
      }

      reject(new Error("Resource File not found: " + resource));
    });
  }
}

 App.Modules.Sites.StoragesTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._foldersList = [];
    }


    __renderBoundedValues(data) {
        if(!data) {
            return;
        }

        if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        this.nodes.Clear();
        data.forEach((storage) => {

            if(storage?.params?.visible === false) {
                return true;
            }

            let newNode = this.FindNode(storage.name);
            if(!newNode) {
                newNode = this.nodes.Add(storage.name);
            }
            newNode.text = storage.desc;
            newNode.isLeaf = true;
            newNode.icon = App.Modules.Sites.Icons.StorageIcon;
            newNode.tag = storage;

            return true;

        });

    }
    
}
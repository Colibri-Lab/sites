App.Modules.Sites.FoldersTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this._foldersList = [];
    }

    _findLevel(domain, parent) {
        let ret = [];
        for(const folder of this._foldersList) {
            if(folder?.domain?.id == domain && (folder?.parent?.id ?? 0) == parent) {
                ret.push(folder);
            }
        }
        ret.sort((a, b) => {
            if(a.order > b.order) {
                return 1;
            }
            else if(a.order < b.order) {
                return -1;
            }
            return 0;
        });
        return ret;
    }

    _insertFolderNode(parenNode, folder) {
        let newNode = this.FindNode('folder' + folder.id);
        if(!newNode) {
            newNode = parenNode.nodes.Add('folder' + folder.id);
        }
        newNode.text = folder.description[Lang.Current] ?? folder.description;
        newNode.icon = folder?.published?.value == 1 ? App.Modules.Sites.Icons.FolderIconPublished : App.Modules.Sites.Icons.FolderIconUnpublished;
        newNode.tag = {type: 'page', data: folder};
        return newNode;
    }

    _renderLevel(node, parent, domain) {

        const level = this._findLevel(domain.id, parent);
        for(const folder of level) {


            let newNode = this._insertFolderNode(node, folder);
            if(!folder.parent) {
                newNode.parentNode = this.FindNode('domain' + folder.domain.id);
            }
            else {
                newNode.parentNode = this.FindNode('folder' + folder.parent.id);
            }

            this._renderLevel(newNode, folder.id, domain);

        };

    }


    _renderDomains() {

        for(const domain of this._domainsList) {

            let newNode = this.FindNode('domain' + domain.id);
            if(!newNode) {
                newNode = this.nodes.Add('domain' + domain.id);
            }
            newNode.text = domain.description[Lang.Current] ?? domain.description;
            newNode.icon = App.Modules.Sites.Icons.FolderIconPublished;
            newNode.tag = {type: 'domain', data: domain};

            this._renderLevel(newNode, 0, domain);
    
        }

    }

    _removeUnexistent() {
        this.allNodes.forEach((node) => {
            if(node.tag === null) {
                return true;
            }

            if(node.tag.type === 'domain' && this._domainsList.indexOf(node.tag.data) === -1) {
                node.Dispose();
            }
            else if(node.tag.type === 'page' && this._foldersList.indexOf(node.tag.data) === -1) {
                node.Dispose();
            }
        });
    }

    __renderBoundedValues(data) {

        Promise.all([
            Sites.Store.AsyncQuery('sites.domains'),
            Sites.Store.AsyncQuery('sites.pages'),
        ]).then((responses) => {

            let domains = responses[0];
            let data = responses[1];

            if(Object.isObject(domains)) {
                domains = Object.values(domains);
            }

            if(Object.isObject(data)) {
                data = Object.values(data);
            }
    
            this._domainsList = domains;
            this._foldersList = data;
    
            this._renderDomains();
    
            this._removeUnexistent();

        }); 

        

    }
    
}
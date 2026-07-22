App.Modules.Sites.FoldersTree = class extends Colibri.UI.Tree {
    
    constructor(name, container) {
        super(name, container);
        this.AddClass('app-manager-folder-tree');
        this._foldersList = [];

        this.hasSearchBox = true;
        this.searchBoxUseEvent = true;

        this.AddHandler('Searched', this.__thisSearched);

        this.AddHandler('NodeExpanded', this.__thisNodeExpanded);
        this.AddHandler('NodeCollapsed', this.__thisNodeExpanded);
    }

    __thisSearched(event, args) {
        this.nodes.Clear();
        this._renderDomains(args.term);
    }

    _setIcon(node) {
        if(node.expanded && !node.isLeaf) {
            node.icon = App.Modules.Sites.Icons.FolderIconPublished; 
        } else {
            node.icon = App.Modules.Sites.Icons.FolderIconPublishedClosed; 
        }
    }

    __thisNodeExpanded(event, args) {
        
        if(!args.node.isLeaf && args.node?.nodes?.Children('firstChild')?.name === 'fake') {
            args.node.nodes.Children('firstChild').Dispose();
            args.node.icon = Colibri.UI.LoadingIcon;
            Colibri.Common.Delay(100).then(() => {
                this._renderLevel(args.node, args.node.tag.data.id, args.node.tag.data.domain, this.searchBoxText);
                this._setIcon(args.node);
            })
        } else {
            this._setIcon(args.node);
        }
        
    }

    _findLevel(domain, parent) {
        let ret = [];
        for(const folder of this._foldersList) {
            if((folder?.domain?.id ?? folder?.domain) == domain && (folder?.parent?.id ?? folder?.parent ?? 0) == parent) {
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

    _insertFolderNode(parenNode, folder, term = '') {
        let newNode = this.FindNode('folder' + folder.id);
        if(!newNode) {
            newNode = parenNode.nodes.Add('folder' + folder.id);
            this._addFake(newNode, folder.id, folder?.domain);
        }
        newNode.text = folder.description[Lang.Current] ?? folder.description;
        newNode.tag = {type: 'page', data: folder};
        if((folder?.published ?? folder?.published?.value) == 1) {
            newNode.AddClass('published');
        } else {
            newNode.RemoveClass('published');
        }

        newNode.icon = App.Modules.Sites.Icons.FolderIconPublishedClosed;
        if(newNode.expanded && !newNode.isLeaf) {
            newNode.icon = App.Modules.Sites.Icons.FolderIconPublished;
        }
        if(term) {
            newNode.found = term;
        }
        return newNode;
    }

    _addFake(node, parent, domain) {

        const level = this._findLevel((domain?.id ?? domain), parent);
        if(level.length === 0) {
            return;
        }

        const fake = node.nodes.Add('fake');
        fake.text = 'Loading ...';

    }

    _renderLevel(node, parent, domain, term = '') {
        

        const level = this._findLevel((domain?.id ?? domain), parent);

        let found = term ? Array.unique(this._foldersList.filter(f => Lang.Translate(f.description).toLowerCase().indexOf(term.toLowerCase()) !== -1).map(f => f.path)) : [];
        found = found.concat.apply([], found)

        for(const folder of level) {
            if(term && folder.path.filter(x => found.includes(x)).length === 0) {
                continue;
            }

            let newNode = this._insertFolderNode(node, folder, term);
            if(!folder.parent) {
                newNode.parentNode = this.FindNode('domain' + (folder?.domain?.id ?? folder?.domain));
            }
            else {
                newNode.parentNode = this.FindNode('folder' + (folder?.parent?.id ?? folder?.parent));
            }

            const nested = this._findLevel((domain?.id ?? domain), folder.id);
            if(nested.length > 0 && newNode.nodes.Children('firstChild')?.name !== 'fake') {
                this._renderLevel(newNode, folder.id, folder?.domain, term);
            }

        }

        this._removeUnexistent();

    }

    _renderPages() {
        return new Promise((resolve, reject) => {
            for(const domain of this._domainsList) {
                const newNode = this.FindNode('domain' + domain.id);
                this._renderLevel(newNode, 0, domain, this.searchBoxText);
            }
            resolve();
        });
    }


    _renderDomains() {

        const term = this.searchBoxText;
        let found = term ? Array.unique(this._foldersList.filter(f => Lang.Translate(f.description).toLowerCase().indexOf(term.toLowerCase()) !== -1).map(f => f.domain)) : [];
        const domainsFound = this._domainsList.filter(d => Lang.Translate(d.description).toLowerCase().indexOf(term.toLowerCase()) !== -1).map(d => d.id);
        found = found.concat(domainsFound);

        for(const domain of this._domainsList) {
            if(term && found.indexOf(domain.id) === -1) {
                continue;
            }

            let newNode = this.FindNode('domain' + domain.id);
            if(!newNode) {
                newNode = this.nodes.Add('domain' + domain.id);
            }
            newNode.text = domain.description[Lang.Current] ?? domain.description;
            if(term) {
                newNode.found = term;
            }
            newNode.tag = {type: 'domain', data: domain};
            newNode.AddClass('published');
            newNode.icon = App.Modules.Sites.Icons.FolderIconPublishedClosed;
            if(newNode.expanded && !newNode.isLeaf) {
                newNode.icon = App.Modules.Sites.Icons.FolderIconPublished;
            }
            if((domain?.closed ?? domain?.closed?.value) == 1) {
                newNode.RemoveClass('published');
            } else {
                newNode.AddClass('published');
            }

            this._renderLevel(newNode, 0, domain, term);
    
        }

        this._removeUnexistent();

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

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {

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
            for(const f of this._foldersList) {
                f.path = this._getPath(f, this._foldersList);
            }

            this._renderDomains();
            
            // Colibri.Common.Delay(100).then(() => {
            //     this._renderPages().then(() => {
            //         this._removeUnexistent();
            //     });
            // });

        }); 

        

    }

    _getPath(f, list) {
        let ret = [];
        ret.push(f.id);
        while(f.parent) {
            ret.push(f.parent);
            f = list.find(item => item.id === f.parent);
        }
        return ret.reverse();
    }
    
}
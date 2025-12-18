App.Modules.Sites.PublicationsGrid = class extends Colibri.UI.Grid {
 

    /**
     * Render bounded to component data
     * @protected
     * @param {*} data 
     * @param {String} path 
     */
    __renderBoundedValues(data, path) {

        if(!data) {
            data = [];
        }
        else if(Object.isObject(data)) {
            data = Object.values(data);
        }

        this.ClearAllRows();
        
        if(data.length == 0) {
            return;
        }

        data.sort((a, b) => {
            return a.order > b.order ? 1 : -1;
        });

        // let found = [];
        data.forEach((pub) => {
            // found.push('pub' + pub.id);
            // let row = this.FindRow('pub' + pub.id);
            this.rows.Add('pub' + pub.id, pub);
            // if(!row) {
            // }
            // else {
            //     row.value = pub;
            // }
        });

        // this.DeleteAllExcept(found);

        this.rows.title = '';
        this.rows.Sort((a, b) => {
            return a.value.order > b.value.order ? 1 : -1;
        });

    }

    
}
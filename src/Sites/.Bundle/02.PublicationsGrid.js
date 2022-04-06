App.Modules.Sites.PublicationsGrid = class extends Colibri.UI.Grid {
 
    __renderBoundedValues(data) {

        if(!Array.isArray(data) && data instanceof Object) {
            data = Object.values(data);
        }

        if(data.length == 0) {
            this.ClearAllRows();
        }

        let found = [];
        data.forEach((pub) => {
            found.push('pub' + pub.id);
            let row = this.FindRow('pub' + pub.id);
            if(!row) {
                this.rows.Add('pub' + pub.id, pub);
            }
            else {
                row.value = pub;
            }
        });

        this.ForEveryRow((name, row) => {
            if(found.indexOf(name) === -1) {
                row.Dispose();
            }
        });

        this.rows.title = '';

    }

    
}
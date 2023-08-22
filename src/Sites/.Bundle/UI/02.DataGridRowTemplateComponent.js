App.Modules.Sites.UI.DataGridRowTemplateComponent = class extends Colibri.UI.FieldsViewer {
    
    constructor(name, container) {
        /* создаем компонент и передаем шаблон */
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.UI.DataGridRowTemplateComponent']);
        this.AddClass('app-modules-sites-ui-datagridrowtemplatecomponent');

        this.rows = 'auto';
        this.columns = 'auto';
        this.orientation = 'vr'; 
        this._rows = 1;
        this._columns = 1;
    }

    _createFields(fields = null, value = null, contentElement = null, showTitles = true) {
        super._createFields(fields, value, contentElement, showTitles);
        
        this._shown.styles = {'grid-template-rows':  this._rows && (this._rows + '').isNumeric() ? 'repeat(' + this._rows + ', 1fr)' : this._rows};
        this._hidden && (this._hidden.styles = {'grid-template-rows': this._rows && (this._rows + '').isNumeric() ? 'repeat(' + this._rows + ', 1fr)' : this._rows});
        
        this._shown.styles = {'grid-template-columns': this._columns && (this._columns + '').isNumeric() ? 'repeat(' + this._columns + ', 1fr)' : this._columns};
        this._hidden && (this._hidden.styles = {'grid-template-columns': this._columns && (this._columns + '').isNumeric() ? 'repeat(' + this._columns + ', 1fr)' : this._columns});

        this._shown.styles = {'gap': this._gap};
        this._hidden && (this._hidden.styles = {'gap': this._gap});


    }

    /**
     * Количество строк
     * @type {Number}
     */
    get rows() {
        return this._rows;
    }
    /**
     * Количество строк
     * @type {Number}
     */
    set rows(value) {
        this._rows = value;
    }

    /**
     * Количество колонок
     * @type {Number}
     */
    get columns() {
        return this._columns;
    }
    /**
     * Количество колонок
     * @type {Number}
     */
    set columns(value) {
        this._columns = value;
    }
    
    /**
     * Ориентация
     * @type {string}
     */
    get orientation() {
        return this._orientation;
    }
    /**
     * Ориентация
     * @type {string}
     */
    set orientation(value) {
        this._orientation = value;
        this._showOrientation();
    }
    _showOrientation() {
        if(this._orientation === 'hr') {
            this.AddClass('-hr');
        }
        else {
            this.RemoveClass('-hr');
        }
    }

    /**
     * Порядок следования элементов
     * @type {string}
     */
    get flow() {
        return this._flow;
    }
    /**
     * Порядок следования элементов
     * @type {string}
     */
    set flow(value) {
        this._flow = value;
        this._showFlow();
    }
    _showFlow() {
        if(this._flow === 'column') {
            this.AddClass('-column');
        }
        else {
            this.RemoveClass('-column');
        }
    }

    /**
     * Отступы между элементами
     * @type {string}
     */
    get gap() {
        return this._gap;
    }
    /**
     * Отступы между элементами
     * @type {string}
     */
    set gap(value) {
        this._gap = value;
    }

    

}
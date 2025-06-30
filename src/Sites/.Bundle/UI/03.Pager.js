App.Modules.Sites.UI.Pager = class extends Colibri.UI.FlexBox {
    
    constructor(name, container) {
        /* создаем компонент и передаем шаблон */
        super(name, container, Colibri.UI.Templates['App.Modules.Sites.UI.Pager']);
        this.AddClass('app-modules-sites-ui-pager');

        this._left = this.Children('left');
        this._right = this.Children('right');
        this._maxPagesO = this.Children('max-pages');
        this._currentPage = this.Children('current-page');
        this._reload = this.Children('reload');
        this._currentPagesize = this.Children('current-pagesize');
        
        
        
        this.maxPages = 1;
        this._affected = 1;
        this._pageSize = 20;

        this._left.AddHandler('Clicked', this.__leftClicked, false, this);
        this._right.AddHandler('Clicked', this.__rightClicked, false, this); 
        this._currentPage.AddHandler(['Filled', 'Cleared'], this.__currentPageChanged, false, this);   
        this._currentPagesize.AddHandler(['Filled', 'Cleared'], this.__currentPagesizeChanged, false, this);   
        this._reload.AddHandler('Clicked', this.__reloadClicked, false, this);

    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __reloadClicked(event, args) {
        if(!this.enabled) {
            return;
        }
        this.Dispatch('Changed', {value: this.value});
    }

    /** @protected */
    _registerEvents() {
        super._registerEvents();
        this.RegisterEvent('Changed', false, 'When page changed');
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __leftClicked(event, args) {
        if(!this._left.enabled) {
            return;
        }
        this.value = this.value - 1;
        this.Dispatch('Changed', {value: this.value});
    }
    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __rightClicked(event, args) {
        if(!this._right.enabled) {
            return;
        }
        this.value = this.value + 1;
        this.Dispatch('Changed', {value: this.value});
    }

    /**
     * @private
     * @param {Colibri.Events.Event} event event object
     * @param {*} args event arguments
     */ 
    __currentPageChanged(event, args) {
        if(!this.hasMaxPages || (this._currentPage.value >= 1 && this._currentPage.value <= this._maxPages)) {
            this.value = this._currentPage.value;
        } else {
            this.value = 1;
        }
        this.Dispatch('Changed', {value: this.value});
    }

    __currentPagesizeChanged(event, args) {
        if(!this.hasMaxPages || (this._currentPagesize.value >= 1 && this._currentPagesize.value <= this._affected)) {
            this.pageSize = this._currentPagesize.value;
        } else {
            this.pageSize = 20;
        }
        this.Dispatch('Changed', {value: this.value});
    }

    _enableButtons() {

        if(!super.enabled) {
            this._left.enabled = false;
            this._right.enabled = false;
            return;
        }

        if(this._value <= 1) {
            this._left.enabled = false;
        } else {
            this._left.enabled = true;
        }

        if(this.hasMaxPages) {
            if(this._value >= this._maxPages) {
                this._right.enabled = false;
            } else {
                this._right.enabled = true;
            }
        }
    }

    /**
     * Current page value
     * @type {Number}
     */
    get value() {
        return this._value;
    }
    /**
     * Current page value
     * @type {Number}
     */
    set value(value) {
        value = this._convertProperty('Number', value);
        this._value = value;
        this._showValue();
    }
    _showValue() {
        this._currentPage.value = this._value;
        this._enableButtons();
    }

    /**
     * Maximum pages
     * @type {Number}
     */
    get maxPages() {
        return this._maxPages;
    }
    /**
     * Maximum pages
     * @type {Number}
     */
    set maxPages(value) {
        value = this._convertProperty('Number', value);
        this._maxPages = value;
        this._showMaxPages();
    }
    _showMaxPages() {
        this._maxPagesO.value = '#{sites-ui-pager-of}'.replaceAll('%s', this._maxPages);
        this.value = 1;
    }

    /**
     * Has max pages
     * @type {Boolean}
     */
    get hasMaxPages() {
        return this._maxPagesO.shown;
    }
    /**
     * Has max pages
     * @type {Boolean}
     */
    set hasMaxPages(value) {
        value = this._convertProperty('Boolean', value);
        this._maxPagesO.shown = value;
        this._right.enabled = true;
    }

    /**
     * 
     * @type {Number}
     */
    get affected() {
        return this._affected;
    }
    /**
     * 
     * @type {Number}
     */
    set affected(value) {
        value = this._convertProperty('Number', value);
        this._affected = value;
        this._showAffected();
    }
    _showAffected() {
        this.maxPages = Math.ceil(this._affected / this._pageSize);
    }

    /**
     * 
     * @type {Number}
     */
    get pageSize() {
        return this._pageSize;
    }
    /**
     * 
     * @type {Number}
     */
    set pageSize(value) {
        value = this._convertProperty('Number', value);
        this._pageSize = value;
        this._showPageSize();
    }
    _showPageSize() {
        this.maxPages = Math.ceil(this._affected / this._pageSize);
    }

    /**
     * 
     * @type {Boolean}
     */
    get enabled() {
        return super.enabled;
    }
    /**
     * 
     * @type {Boolean}
     */
    set enabled(value) {
        value = this._convertProperty('Boolean', value);
        super.enabled = value;
        
        this._currentPage.enabled = value;
        this._left.enabled = value;
        this._right.enabled = value;
        if(value) {
            this._enableButtons();
        }
        
    }

}
App.Modules.Sites.UI.TextSnippet = class extends Colibri.UI.Pane {

    constructor(name, container) {
        super(name, container);

        this.AddClass('app-component-textsnippet');



    }

    set value(value) {
        this._value = value;
        this._setValue();
    }

    get value() {
        return this._value;
    }

    _setValue() {
        this.GenerateChildren('<dummy>' + this._value + '</dummy>');
    }

}
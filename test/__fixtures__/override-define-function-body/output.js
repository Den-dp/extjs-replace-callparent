var _MyApp_MyClass_myMethod_original = (Ext.panel.Panel.prototype || Ext.panel.Panel).myMethod;

Ext.define('MyApp.MyClass', function (MyClass) {
    return {
        override: 'Ext.panel.Panel',

        myMethod: function () {
            _MyApp_MyClass_myMethod_original.call(this);
        }
    };
});


import initDefinitionFactory from './definition';

export default function ({ types: t }) {

    const findParentDefinition = initDefinitionFactory(t);

    function isThisCallParentCallExpression(path) {
        let node = path.node.callee;
        return isCallParentCallee(node) &&
            (t.isThisExpression(node.object) || isIdentifierResolvesToThisExpression(node.object, path.scope));
    }

    function isIdentifierResolvesToThisExpression(node, scope) {
        return t.isThisExpression(scope.getBinding(node.name).path.node.init);
    }

    function isCallParentCallee(node) {
        return t.isMemberExpression(node) && t.isIdentifier(node.property, { name: 'callParent' });
    }

    function isClassMethod(path) {
        return (path.isObjectProperty() && t.isFunction(path.node.value)) ||
            path.isObjectMethod();
    }

    function buildMethodRef(protoRef, methodName) {
        return t.memberExpression(
            t.logicalExpression('||', t.memberExpression(protoRef, t.identifier('prototype')), protoRef),
            t.identifier(methodName)
        );
    }

    function buildReplacement(methodRef, args) {
        const memberExpression = t.memberExpression(methodRef, t.identifier(args.length ? 'apply' : 'call'));
        return args.length ? t.callExpression(memberExpression, [t.thisExpression(), args[0]]) :
            t.callExpression(memberExpression, [t.thisExpression()]);
    }

    function getMethodName(callParentPath) {
        const clsMethod = callParentPath.findParent(isClassMethod);
        if (!clsMethod) {
            throw path.buildCodeFrameError("Unable to find method declaration for this 'callParent'");
        }
        return clsMethod.node.key.name;
    }

    return {
        visitor: {
            CallExpression(path, state) {
                if (!isThisCallParentCallExpression(path)) {
                    return;
                }

                // The name of the method which the `callParent` is within
                const methodName = getMethodName(path);

                // The definition (either `Ext.define` or `Ext.override`)
                const definition = findParentDefinition(path, state.opts.extNames);

                let methodRef = buildMethodRef(definition.protoRef, methodName);
                if (definition.isOverride) {
                    methodRef = definition.prependVariableRef(methodRef);
                }

                path.replaceWith(buildReplacement(methodRef, path.node.arguments));
            }
        }
    };
};

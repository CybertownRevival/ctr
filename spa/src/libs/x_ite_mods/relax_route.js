X3D.require(["x_ite/Parser/Parser"], function(Parser) {
    Parser.prototype.nodeStatements = function(field) {
        let nodeStatementWithRoute = () => {
            while(this.routeStatement()) {}
            return this.nodeStatement();
        };
        var node = nodeStatementWithRoute ();
        
        while (node !== false)
        {
            field .push (node);
            
            node = nodeStatementWithRoute ();
        }
    };
});
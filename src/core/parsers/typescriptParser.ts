import * as ts from "typescript";

export interface ParsedSymbol {
  name: string;
  type: "class" | "interface" | "function" | "method" | "property" | "enum" | "type" | "const" | "variable";
  line: number;
  character: number;
  isExported: boolean;
  modifiers?: string[];
  heritage?: {
    extends?: string[];
    implements?: string[];
  };
  members?: ParsedSymbol[];
  parameters?: {
    name: string;
    type?: string;
    optional?: boolean;
  }[];
  returnType?: string;
  jsDoc?: string;
}

export interface ParsedFile {
  filePath: string;
  symbols: ParsedSymbol[];
  imports: {
    name: string;
    module: string;
    isDefault?: boolean;
    isNamespace?: boolean;
  }[];
  exports: string[];
}

export class TypeScriptParser {
  private program: ts.Program | null = null;

  parseFile(filePath: string, sourceText: string): ParsedFile {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    const symbols: ParsedSymbol[] = [];
    const imports: ParsedFile["imports"] = [];
    const exports: string[] = [];

    this.visitNode(sourceFile, sourceFile, symbols, imports, exports);

    return {
      filePath,
      symbols,
      imports,
      exports,
    };
  }

  private visitNode(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[],
    imports: ParsedFile["imports"],
    exports: string[]
  ): void {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        this.handleClassDeclaration(node as ts.ClassDeclaration, line, character, sourceFile, symbols);
        break;

      case ts.SyntaxKind.InterfaceDeclaration:
        this.handleInterfaceDeclaration(node as ts.InterfaceDeclaration, line, character, sourceFile, symbols);
        break;

      case ts.SyntaxKind.FunctionDeclaration:
        this.handleFunctionDeclaration(node as ts.FunctionDeclaration, line, character, sourceFile, symbols, exports);
        break;

      case ts.SyntaxKind.EnumDeclaration:
        this.handleEnumDeclaration(node as ts.EnumDeclaration, line, character, sourceFile, symbols);
        break;

      case ts.SyntaxKind.TypeAliasDeclaration:
        this.handleTypeAliasDeclaration(node as ts.TypeAliasDeclaration, line, character, sourceFile, symbols);
        break;

      case ts.SyntaxKind.VariableStatement:
        this.handleVariableStatement(node as ts.VariableStatement, line, character, sourceFile, symbols, exports);
        break;

      case ts.SyntaxKind.ImportDeclaration:
        this.handleImportDeclaration(node as ts.ImportDeclaration, sourceFile, imports);
        break;

      case ts.SyntaxKind.ExportAssignment:
      case ts.SyntaxKind.ExportDeclaration:
        this.handleExport(node, sourceFile, exports);
        break;
    }

    ts.forEachChild(node, (child) =>
      this.visitNode(child, sourceFile, symbols, imports, exports)
    );
  }

  private handleClassDeclaration(
    node: ts.ClassDeclaration,
    line: number,
    character: number,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[]
  ): void {
    if (!node.name) return;

    const symbol: ParsedSymbol = {
      name: node.name.text,
      type: "class",
      line: line + 1,
      character: character + 1,
      isExported: this.hasExportModifier(node),
      modifiers: this.getModifiers(node),
      heritage: this.getHeritage(node),
      members: [],
      jsDoc: this.getJsDoc(node, sourceFile),
    };

    node.members.forEach((member) => {
      const memberSymbol = this.extractClassMember(member, sourceFile);
      if (memberSymbol) {
        symbol.members!.push(memberSymbol);
      }
    });

    symbols.push(symbol);
  }

  private handleInterfaceDeclaration(
    node: ts.InterfaceDeclaration,
    line: number,
    character: number,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[]
  ): void {
    const symbol: ParsedSymbol = {
      name: node.name.text,
      type: "interface",
      line: line + 1,
      character: character + 1,
      isExported: this.hasExportModifier(node),
      modifiers: this.getModifiers(node),
      heritage: { extends: node.heritageClauses?.flatMap((h) =>
        h.types.map((t) => t.getText(sourceFile))
      ) },
      members: [],
      jsDoc: this.getJsDoc(node, sourceFile),
    };

    node.members.forEach((member) => {
      const memberSymbol = this.extractInterfaceMember(member, sourceFile);
      if (memberSymbol) {
        symbol.members!.push(memberSymbol);
      }
    });

    symbols.push(symbol);
  }

  private handleFunctionDeclaration(
    node: ts.FunctionDeclaration,
    line: number,
    character: number,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[],
    exports: string[]
  ): void {
    if (!node.name) return;

    const symbol: ParsedSymbol = {
      name: node.name.text,
      type: "function",
      line: line + 1,
      character: character + 1,
      isExported: this.hasExportModifier(node),
      modifiers: this.getModifiers(node),
      parameters: this.getParameters(node.parameters, sourceFile),
      returnType: node.type?.getText(sourceFile),
      jsDoc: this.getJsDoc(node, sourceFile),
    };

    symbols.push(symbol);

    if (symbol.isExported) {
      exports.push(symbol.name);
    }
  }

  private handleEnumDeclaration(
    node: ts.EnumDeclaration,
    line: number,
    character: number,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[]
  ): void {
    const symbol: ParsedSymbol = {
      name: node.name.text,
      type: "enum",
      line: line + 1,
      character: character + 1,
      isExported: this.hasExportModifier(node),
      modifiers: this.getModifiers(node),
      jsDoc: this.getJsDoc(node, sourceFile),
    };

    symbols.push(symbol);
  }

  private handleTypeAliasDeclaration(
    node: ts.TypeAliasDeclaration,
    line: number,
    character: number,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[]
  ): void {
    const symbol: ParsedSymbol = {
      name: node.name.text,
      type: "type",
      line: line + 1,
      character: character + 1,
      isExported: this.hasExportModifier(node),
      modifiers: this.getModifiers(node),
      jsDoc: this.getJsDoc(node, sourceFile),
    };

    symbols.push(symbol);
  }

  private handleVariableStatement(
    node: ts.VariableStatement,
    line: number,
    character: number,
    sourceFile: ts.SourceFile,
    symbols: ParsedSymbol[],
    exports: string[]
  ): void {
    const isExported = this.hasExportModifier(node);

    node.declarationList.declarations.forEach((decl) => {
      if (ts.isIdentifier(decl.name)) {
        const symbol: ParsedSymbol = {
          name: decl.name.text,
          type: this.isConst(node) ? "const" : "variable",
          line: line + 1,
          character: character + 1,
          isExported,
          modifiers: this.getModifiers(node),
          jsDoc: this.getJsDoc(node, sourceFile),
        };

        symbols.push(symbol);

        if (isExported) {
          exports.push(symbol.name);
        }
      }
    });
  }

  private handleImportDeclaration(
    node: ts.ImportDeclaration,
    sourceFile: ts.SourceFile,
    imports: ParsedFile["imports"]
  ): void {
    const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

    if (node.importClause) {
      if (node.importClause.name) {
        imports.push({
          name: node.importClause.name.text,
          module: moduleSpecifier,
          isDefault: true,
        });
      }

      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach((element) => {
            imports.push({
              name: element.name.text,
              module: moduleSpecifier,
              isDefault: false,
            });
          });
        } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          imports.push({
            name: node.importClause.namedBindings.name.text,
            module: moduleSpecifier,
            isNamespace: true,
          });
        }
      }
    }
  }

  private handleExport(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    exports: string[]
  ): void {
    if (ts.isExportAssignment(node)) {
      if (ts.isIdentifier(node.expression)) {
        exports.push(node.expression.text);
      }
    }
  }

  private extractClassMember(
    member: ts.ClassElement,
    sourceFile: ts.SourceFile
  ): ParsedSymbol | null {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(member.getStart());

    if (ts.isMethodDeclaration(member) && member.name) {
      return {
        name: member.name.getText(sourceFile),
        type: "method",
        line: line + 1,
        character: character + 1,
        isExported: false,
        modifiers: this.getModifiers(member),
        parameters: this.getParameters(member.parameters, sourceFile),
        returnType: member.type?.getText(sourceFile),
      };
    }

    if (ts.isPropertyDeclaration(member) && member.name) {
      return {
        name: member.name.getText(sourceFile),
        type: "property",
        line: line + 1,
        character: character + 1,
        isExported: false,
        modifiers: this.getModifiers(member),
      };
    }

    return null;
  }

  private extractInterfaceMember(
    member: ts.TypeElement,
    sourceFile: ts.SourceFile
  ): ParsedSymbol | null {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(member.getStart());

    if (ts.isMethodSignature(member) && member.name) {
      return {
        name: member.name.getText(sourceFile),
        type: "method",
        line: line + 1,
        character: character + 1,
        isExported: false,
        parameters: this.getParameters(member.parameters, sourceFile),
        returnType: member.type?.getText(sourceFile),
      };
    }

    if (ts.isPropertySignature(member) && member.name) {
      return {
        name: member.name.getText(sourceFile),
        type: "property",
        line: line + 1,
        character: character + 1,
        isExported: false,
      };
    }

    return null;
  }

  private getModifiers(node: ts.Node): string[] {
    const modifiers: string[] = [];
    if (ts.canHaveModifiers(node)) {
      const nodeModifiers = ts.getModifiers(node);
      nodeModifiers?.forEach((mod) => {
        modifiers.push(ts.SyntaxKind[mod.kind].toLowerCase().replace("keyword", ""));
      });
    }
    return modifiers;
  }

  private hasExportModifier(node: ts.Node): boolean {
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node);
      return modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false;
    }
    return false;
  }

  private isConst(node: ts.VariableStatement): boolean {
    return (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
  }

  private getHeritage(node: ts.ClassDeclaration): { extends?: string[]; implements?: string[] } {
    const heritage: { extends?: string[]; implements?: string[] } = {};

    if (node.heritageClauses) {
      node.heritageClauses.forEach((clause) => {
        const types = clause.types.map((t) => t.getText());
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          heritage.extends = types;
        } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          heritage.implements = types;
        }
      });
    }

    return heritage;
  }

  private getParameters(
    params: ts.NodeArray<ts.ParameterDeclaration>,
    sourceFile: ts.SourceFile
  ): { name: string; type?: string; optional?: boolean }[] {
    return params.map((param) => ({
      name: param.name.getText(sourceFile),
      type: param.type?.getText(sourceFile),
      optional: !!param.questionToken,
    }));
  }

  private getJsDoc(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
    const jsDoc = ts.getJSDocCommentsAndTags(node);
    if (jsDoc && jsDoc.length > 0) {
      return jsDoc[0].getText(sourceFile);
    }
    return undefined;
  }
}

export const typescriptParser = new TypeScriptParser();

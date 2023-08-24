// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


// 默认使用当前项目中的node_modules的bin目录
// 也可以读取配置路径

const binFolder = 'node_modules';

/**
 * 
 * @description 获取当前文件所属的workSpace目录
 */
const getCurrentWorkSpaceFolder = (filePath: string) => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    if (filePath) {
      const workspaceFolder = workspaceFolders.find(folder => filePath.startsWith(folder.uri.fsPath));
      return workspaceFolder?.uri.fsPath;
    }
  }
};
/**
 * 
 * @description 获取当前文件所属的bin目录
 */
const getCurrentWorkSpaceBin = (filePath: string) => {
  const currentWorkSpaceFolder = getCurrentWorkSpaceFolder(filePath);
  if (currentWorkSpaceFolder) {
    return path.join(currentWorkSpaceFolder, binFolder, '.bin');
  }
  return null;
};

// 这里请使用反斜杠，使用path.join()方法在windows中会报错

const getCommand = (filePath: string) => `jest ${path.basename(path.dirname(filePath)) + '/' + path.basename(filePath)} --watch`;

const getTerminal = (cwd: string, env: {
  [key: string]: string | null | undefined;
}) => {
  let terminal = vscode.window.terminals.find(terminal => terminal.name === 'simpleJest');
  if (terminal) {
    terminal.dispose();
  }
  return vscode.window.createTerminal({
    name: 'simpleJest',
    cwd: cwd,
    env: {
      ...env
    }
  });
};


export function activate(context: vscode.ExtensionContext) {
  let testEditorFile = vscode.commands.registerCommand('QuickJest.jest', () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {

      const currentFilePath = editor.document.uri.fsPath;
      // 确保当前文件已经保存
      if (fs.existsSync(editor.document.uri.fsPath)) {
        const binPath = getCurrentWorkSpaceBin(currentFilePath);
        const workSpaceFolder = getCurrentWorkSpaceFolder(currentFilePath);
        if (!binPath || !fs.existsSync(binPath)) {
          vscode.window.showInformationMessage('当前项目未安装node_modules，请手动设置jest所在路径');
          return;
        }
        // 可以是其他命令行
        // 先将原先的terminal干掉然后重新启动jest
        const terminal = getTerminal(workSpaceFolder || path.dirname(currentFilePath), {
          PATH: binPath + path.delimiter + process.env.PATH
        });
        terminal.sendText(getCommand(currentFilePath));

      } else {
        vscode.window.showInformationMessage('请先保存此文件');

      }
    } else {
      vscode.window.showInformationMessage('No editor is active');

    }
  });
  let testExplorerFile = vscode.commands.registerCommand('QuickJest.jestExplorer', (uri:vscode.Uri) => {
    const fileUri = uri.fsPath;
    const binPath = getCurrentWorkSpaceBin(fileUri);
    const workSpaceFolder = getCurrentWorkSpaceFolder(fileUri);
    if (!binPath || !fs.existsSync(binPath)) {
      vscode.window.showInformationMessage('当前项目未安装node_modules，请手动设置jest所在路径');
      return;
    }
    const terminal = getTerminal(workSpaceFolder || path.dirname(fileUri), {
      PATH: binPath + path.delimiter + process.env.PATH
    });
    terminal.sendText(getCommand(fileUri));
  });

  context.subscriptions.push(testEditorFile);
  context.subscriptions.push(testExplorerFile);
}

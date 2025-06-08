const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('zettelkasten.createNote', async function () {
        // --- 1. Get User Input for Title ---
        const noteTitle = await vscode.window.showInputBox({
            prompt: 'Enter the title for your new Zettel note',
            placeHolder: 'e.g., Multiverse Analysis',
        });

        if (!noteTitle) {
            vscode.window.showInformationMessage('Note creation cancelled.');
            return;
        }

        // --- 2. Get User Input for Parent Note (Optional) ---
        const mdFiles = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**');
        const quickPickItems = mdFiles.map(file => ({
            label: path.basename(file.fsPath),
            description: path.dirname(file.fsPath),
            fsPath: file.fsPath,
        }));

        // Add an option to create a note without a parent
        quickPickItems.unshift({ label: "(No Parent)", description: "Create note in the default directory", fsPath: null });

        const parentSelection = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select a parent note (optional)',
            matchOnDescription: true,
        });

        // Check if the user pressed Escape
        if (typeof parentSelection === 'undefined') {
            vscode.window.showInformationMessage('Note creation cancelled.');
            return;
        }

        const parentPath = parentSelection.fsPath;

        // --- 3. Generate Timestamps and Filename ---
        const now = new Date();
        const pad = (num) => String(num).padStart(2, '0');

        // Filename timestamp: YYMMDD.HHMM
        const fileTimestamp = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;

        // Metadata timestamp: YYYY-MM-DD HH:MM
        const metaTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        const newFileName = `${fileTimestamp} + ${noteTitle}.md`;

        // --- 4. Determine New File Path ---
        let newNoteDirectory;
        const config = vscode.workspace.getConfiguration('zettelkasten');

        if (parentPath) {
            newNoteDirectory = path.dirname(parentPath);
        } else {
            newNoteDirectory = config.get('notesDirectory') || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
        }

        if (!newNoteDirectory) {
            vscode.window.showErrorMessage('Could not determine a directory for the new note. Please set it in settings or select a parent note.');
            return;
        }

        const newFilePath = path.join(newNoteDirectory, newFileName);

        // --- 5. Get Template Content ---
        let templateContent;
        const templatePath = config.get('templateFilePath');

        if (templatePath && fs.existsSync(templatePath)) {
            templateContent = fs.readFileSync(templatePath, 'utf8');
        } else {
            // Default template if none is provided or found
            templateContent = `---
aliases:
  - {{aliases}}
title: {{title}}
created: {{created}}
modified: {{modified}}
Parent: {{parent}}
tags:
  - zettel
---

# {{title}}
`;
        }

        // --- 6. Populate Template ---
        let newFileContent = templateContent
            .replace(/{{title}}/g, noteTitle)
            .replace(/{{aliases}}/g, noteTitle)
            .replace(/{{created}}/g, metaTimestamp)
            .replace(/{{modified}}/g, metaTimestamp);

        if (parentPath) {
            const parentFileNameWithoutExt = path.basename(parentPath, '.md');
            newFileContent = newFileContent.replace(/{{parent}}/g, `[[${parentFileNameWithoutExt}]]`);
        } else {
            // If no parent, remove the "Parent:" line completely
            newFileContent = newFileContent.replace(/^Parent: .*\r?\n/m, '');
        }

        // --- 7. Create and Open New File ---
        try {
            const newFileUri = vscode.Uri.file(newFilePath);
            await vscode.workspace.fs.writeFile(newFileUri, Buffer.from(newFileContent, 'utf8'));

            const doc = await vscode.workspace.openTextDocument(newFileUri);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`Successfully created: ${newFileName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create note: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}

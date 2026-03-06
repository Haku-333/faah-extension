const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
// const myExtension = require('../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('registers runTests command', async () => {
		const extension = vscode.extensions.all.find(
			(ext) => ext.packageJSON && ext.packageJSON.name === 'test-fail-sound'
		);

		assert.ok(extension, 'Expected development extension to be present');
		await extension.activate();

		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('test-fail-sound.runTests'),
			'Expected command "test-fail-sound.runTests" to be registered'
		);
	});
});

/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

 CKEDITOR.editorConfig = function( config ) {
 	config.toolbarGroups = [
 		{ name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
 		{ name: 'styles', groups: [ 'styles' ] },
 		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
 		{ name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
 		{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
 		{ name: 'forms', groups: [ 'forms' ] },
 		{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
 		{ name: 'colors', groups: [ 'colors' ] },
 		{ name: 'links', groups: [ 'links' ] },
 		{ name: 'insert', groups: [ 'insert' ] },
 		{ name: 'tools', groups: [ 'tools' ] },
 		{ name: 'others', groups: [ 'others' ] },
 		{ name: 'about', groups: [ 'about' ] }
 	];

  config.startupFocus = true;
  config.width = '100%';
  config.resize_enabled = false;
  config.linkShowAdvancedTab = false;
  config.linkShowTargetTab = false;

 	config.removeButtons = 'Cut,Copy,Paste,Undo,Redo,Anchor,Subscript,Superscript,Font,BulletedList,NumberedList,Outdent,Indent,About';
 };

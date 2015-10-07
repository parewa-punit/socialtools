/*global fireEvent, selectElementContents,
         selectElementContentsAndFire,
         placeCursorInsideElement */

describe('MediumEditor.extensions.toolbar TestCase', function () {
    'use strict';

    beforeEach(function () {
        setupTestHelpers.call(this);
        this.el = this.createElement('div', 'editor');
    });

    afterEach(function () {
        this.cleanupTest();
    });

    describe('Initialization', function () {
        it('should call the createToolbar method', function () {
            spyOn(MediumEditor.extensions.toolbar.prototype, 'createToolbar').and.callThrough();
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar');
            expect(toolbar).not.toBeUndefined();
            expect(toolbar.createToolbar).toHaveBeenCalled();
        });

        it('should create a new element for the editor toolbar', function () {
            expect(document.querySelectorAll('.medium-editor-toolbar').length).toBe(0);
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar').getToolbarElement();
            expect(toolbar.className).toMatch(/medium-editor-toolbar/);
            expect(document.querySelectorAll('.medium-editor-toolbar').length).toBe(1);
        });

        it('should not create an anchor form element or anchor extension if anchor is not passed as a button', function () {
            expect(document.querySelectorAll('.medium-editor-toolbar-form-anchor').length).toBe(0);
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        buttons: ['bold', 'italic', 'underline']
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');
            expect(toolbar.getToolbarElement().querySelectorAll('.medium-editor-toolbar-form-anchor').length).toBe(0);
            expect(editor.getExtensionByName('anchor')).toBeUndefined();
        });
    });

    describe('Toolbars', function () {
        it('should enable bold button in toolbar when bold text is selected', function () {
            var editor = null,
                newElement = this.createElement('div', '', 'lorem ipsum <b><div id="bold_dolorOne">dolor</div></b>');

            newElement.id = 'editor-for-toolbar-test';

            editor = this.newMediumEditor(document.getElementById('editor-for-toolbar-test'), { delay: 0 });
            var toolbar = editor.getExtensionByName('toolbar');
            selectElementContentsAndFire(document.getElementById('bold_dolorOne'));

            jasmine.clock().tick(51);
            expect(toolbar.getToolbarElement().querySelector('button[data-action="bold"]').classList.contains('medium-editor-button-active')).toBe(true);
        });

        it('should not activate buttons in toolbar when stopSelectionUpdates has been called, but should activate buttons after startSelectionUpdates is called', function () {
            this.el.innerHTML = 'lorem ipsum <b><div id="bold_dolorTwo">dolor</div></b>';

            var editor = this.newMediumEditor(document.querySelectorAll('.editor'), { delay: 0 }),
                toolbar = editor.getExtensionByName('toolbar');

            editor.stopSelectionUpdates();
            selectElementContentsAndFire(document.getElementById('bold_dolorTwo'));

            jasmine.clock().tick(51);
            expect(toolbar.getToolbarElement().querySelector('button[data-action="bold"]').classList.contains('medium-editor-button-active')).toBe(false);

            editor.startSelectionUpdates();
            selectElementContentsAndFire(document.getElementById('bold_dolorTwo'), { eventToFire: 'mouseup' });

            jasmine.clock().tick(51);
            expect(toolbar.getToolbarElement().querySelector('button[data-action="bold"]').classList.contains('medium-editor-button-active')).toBe(true);
        });

        it('should trigger the showToolbar custom event when toolbar is shown', function () {
            var editor = this.newMediumEditor('.editor'),
                callback = jasmine.createSpy();

            this.el.innerHTML = 'specOnShowToolbarTest';

            editor.subscribe('showToolbar', callback);

            selectElementContentsAndFire(this.el, { eventToFire: 'focus' });

            expect(callback).toHaveBeenCalledWith({}, this.el);
        });

        it('should trigger positionToolbar custom event when toolbar is moved', function () {
            var editor = this.newMediumEditor('.editor'),
                callback = jasmine.createSpy();

            this.el.innerHTML = 'specOnUpdateToolbarTest';
            editor.subscribe('positionToolbar', callback);

            selectElementContentsAndFire(this.el, { eventToFire: 'focus' });

            expect(callback).toHaveBeenCalledWith({}, this.el);

        });

        it('should trigger positionToolbar before position called', function () {
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar'),
                temp = {
                    update: function () {
                        expect(toolbar.positionToolbar).not.toHaveBeenCalled();
                    }
                };

            spyOn(toolbar, 'positionToolbar').and.callThrough();
            spyOn(temp, 'update').and.callThrough();
            this.el.innerHTML = 'position sanity check';
            editor.subscribe('positionToolbar', temp.update);
            selectElementContentsAndFire(this.el, { eventToFire: 'focus' });

            expect(temp.update).toHaveBeenCalled();
            expect(toolbar.positionToolbar).toHaveBeenCalled();
        });

        it('should trigger the hideToolbar custom event when toolbar is hidden', function () {
            var editor = this.newMediumEditor('.editor'),
                callback = jasmine.createSpy();

            this.el.innerHTML = 'specOnShowToolbarTest';

            editor.subscribe('hideToolbar', callback);

            selectElementContentsAndFire(this.el, { eventToFire: 'focus' });

            // Remove selection and call check selection, which should make the toolbar be hidden
            jasmine.clock().tick(1);
            window.getSelection().removeAllRanges();
            editor.checkSelection();

            expect(callback).toHaveBeenCalledWith({}, this.el);
        });

        it('should be possible to listen to toolbar events from extensions', function () {
            var callbackShow = jasmine.createSpy('show'),
                callbackHide = jasmine.createSpy('hide'),
                TestExtension = MediumEditor.Extension.extend({
                    parent: true,
                    init: function () {
                        this.base.subscribe('showToolbar', callbackShow);
                        this.base.subscribe('hideToolbar', callbackHide);
                    }
                }),
                editor = this.newMediumEditor('.editor', {
                    extensions: { 'testExtension': new TestExtension() }
                });

            this.el.innerHTML = 'specOnShowToolbarTest';

            selectElementContentsAndFire(this.el, { eventToFire: 'focus' });
            expect(callbackShow).toHaveBeenCalledWith({}, this.el);

            // Remove selection and call check selection, which should make the toolbar be hidden
            jasmine.clock().tick(1);
            window.getSelection().removeAllRanges();
            editor.checkSelection();

            expect(callbackHide).toHaveBeenCalledWith({}, this.el);
        });

        it('should not hide when selecting text within editor, but release mouse outside of editor', function () {
            this.el.innerHTML = 'lorem ipsum';
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar');

            selectElementContentsAndFire(editor.elements[0].firstChild);
            fireEvent(editor.elements[0], 'mousedown');
            fireEvent(document.body, 'mouseup');
            fireEvent(document.body, 'click');
            jasmine.clock().tick(51);

            expect(toolbar.isDisplayed()).toBe(true);
        });

        it('should hide the toolbar when clicking outside the toolbar on an element that does not clear selection', function () {
            this.el.innerHTML = 'lorem ipsum';
            var outsideElement = this.createElement('div', '', 'Click Me, I don\'t clear selection'),
                editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar');

            outsideElement.setAttribute('style', '-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;');

            selectElementContentsAndFire(editor.elements[0].firstChild);
            jasmine.clock().tick(51);
            expect(toolbar.isDisplayed()).toBe(true);

            fireEvent(outsideElement, 'mousedown');
            fireEvent(outsideElement, 'mouseup');
            fireEvent(outsideElement, 'click');
            jasmine.clock().tick(51);

            expect(document.getSelection().rangeCount).toBe(1);
            expect(toolbar.isDisplayed()).toBe(false);
        });

        it('should hide the toolbar when selecting multiple paragraphs and the allowMultiParagraphSelection option is false', function () {
            this.el.innerHTML = '<p id="p-one">lorem ipsum</p><p id="p-two">lorem ipsum</p>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        allowMultiParagraphSelection: false
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');
            selectElementContentsAndFire(document.getElementById('p-one'), { eventToFire: 'focus' });
            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
            selectElementContentsAndFire(this.el, { eventToFire: 'mouseup' });
            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
        });
    });

    describe('Static Toolbars', function () {
        it('should let the user click outside of the selected area to leave', function () {
            this.el.innerHTML = 'This is my text<span>and this is some other text</span>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        updateOnEmptySelection: true,
                        standardizeSelectionStart: true
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');

            placeCursorInsideElement(this.el.firstChild, 'This is my text'.length);
            fireEvent(this.el.parentNode, 'click', {
                target: this.el.parentNode,
                currentTarget: this.el
            });

            jasmine.clock().tick(1);
            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
            expect(this.el.getAttribute('medium-editor-focused')).not.toBeTruthy();
        });

        it('should not throw an error when check selection is called when there is an empty selection', function () {
            this.el.innerHTML = '<b>lorem ipsum</b>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        sticky: true
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');

            selectElementContentsAndFire(this.el.querySelector('b'));
            window.getSelection().removeAllRanges();
            editor.checkSelection();
            jasmine.clock().tick(1); // checkSelection delay
            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
            expect(toolbar.getToolbarElement().querySelector('[data-action="bold"]').classList.contains('medium-editor-button-active')).toBe(true);
        });

        it('should show and update toolbar buttons when toolbar is static and updateOnEmptySelection option is set to true', function () {
            this.el.innerHTML = '<b>lorem ipsum</b>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        sticky: true,
                        updateOnEmptySelection: true
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');

            selectElementContentsAndFire(this.el.querySelector('b'));
            window.getSelection().removeAllRanges();
            editor.checkSelection();
            jasmine.clock().tick(1); // checkSelection delay
            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
            expect(toolbar.getToolbarElement().querySelector('[data-action="bold"]').classList.contains('medium-editor-button-active')).toBe(true);
        });

        it('should be hidden for one medium-editor instance when another medium-editor instance shows its toolbar', function () {
            var editorOne,
                editorTwo,
                elTwo = this.createElement('div', '', '<span id="editor-span-2">lorem ipsum</span>');

            elTwo.id = 'editor-div-two';
            this.el.innerHTML = '<span id="editor-span-1">lorem ipsum</span>';

            editorOne = this.newMediumEditor('.editor', {
                toolbar: {
                    static: true
                }
            });
            editorTwo = this.newMediumEditor(document.getElementById('editor-div-two'), {
                toolbar: {
                    static: true
                }
            });
            var toolbarOne = editorOne.getExtensionByName('toolbar'),
                toolbarTwo = editorTwo.getExtensionByName('toolbar');

            selectElementContents(document.getElementById('editor-span-1'));
            fireEvent(this.el, 'focus', {
                target: this.el,
                relatedTarget: elTwo
            });

            jasmine.clock().tick(1); // checkSelection delay

            expect(toolbarOne.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
            expect(toolbarTwo.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);

            selectElementContents(document.getElementById('editor-span-2'));
            fireEvent(elTwo, 'focus', {
                target: elTwo,
                relatedTarget: this.el
            });

            jasmine.clock().tick(1); // checkSelection delay

            expect(toolbarOne.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
            expect(toolbarTwo.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
        });
    });

    describe('Deactive', function () {
        it('should remove select event from elements', function () {
            spyOn(this.el, 'addEventListener');
            var editor = this.newMediumEditor('.editor');
            expect(this.el.addEventListener).toHaveBeenCalled();
            spyOn(this.el, 'removeEventListener');
            editor.destroy();
            expect(this.el.removeEventListener).toHaveBeenCalled();
        });
    });

    describe('Disable', function () {
        it('should not show the toolbar on elements when toolbar option is set to false', function () {
            var editor = this.newMediumEditor('.editor', {
                toolbar: false
            });
            expect(editor.options.toolbar).toBe(false);
            expect(document.getElementsByClassName('medium-editor-toolbar-actions').length).toBe(0);
        });

        it('should not create the toolbar if all elements has data attr of disable-toolbar', function () {
            this.el.setAttribute('data-disable-toolbar', 'true');
            var editor = this.newMediumEditor('.editor');
            expect(document.getElementsByClassName('medium-editor-toolbar-actions').length).toBe(0);
            expect(editor.getExtensionByName('toolbar')).toBeUndefined();
        });

        it('should not show the toolbar when one element has a data attr of disable-toolbar set and text is selected', function () {
            var element = this.createElement('div', 'editor', 'lorem ipsum'),
                editor = null;

            element.setAttribute('data-disable-toolbar', 'true');

            editor = this.newMediumEditor(document.querySelectorAll('.editor'));
            var toolbar = editor.getExtensionByName('toolbar');

            expect(editor.elements.length).toBe(2);
            expect(toolbar.getToolbarElement().style.display).toBe('');
            selectElementContentsAndFire(element);
            jasmine.clock().tick(51);

            expect(toolbar.getToolbarElement().style.display).toBe('');
        });

        it('should not display toolbar when selected text within an element with contenteditable="false"', function () {
            this.createElement('div', 'editor');
            this.el.innerHTML = 'lorem ipsum <div id="cef_el" contenteditable="false">dolor</div>';

            var editor = this.newMediumEditor(document.querySelectorAll('.editor'), { delay: 0 }),
                toolbar = editor.getExtensionByName('toolbar');

            selectElementContentsAndFire(document.getElementById('cef_el'));

            jasmine.clock().tick(51);
            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(false);
        });

        it('should show the toolbar if its text are selected even though one or more elements that has a data attr of disable-toolbar', function () {
            var editor,
                element = this.createElement('div', 'editor');

            element.setAttribute('data-disable-toolbar', 'true');
            this.el.innerHTML = 'lorem ipsum';
            editor = this.newMediumEditor(document.querySelectorAll('.editor'));
            var toolbar = editor.getExtensionByName('toolbar');
            expect(editor.elements.length).toBe(2);
            expect(toolbar.getToolbarElement().style.display).toBe('');
            selectElementContentsAndFire(this.el, { eventToFire: 'focus' });

            expect(toolbar.getToolbarElement().classList.contains('medium-editor-toolbar-active')).toBe(true);
        });

        it('should not try to toggle toolbar when toolbar option is set to false', function () {
            this.createElement('div', 'editor');
            this.el.innerHTML = 'lorem ipsum';

            var editor = this.newMediumEditor(document.querySelectorAll('.editor'), {
                    toolbar: false
                }),
                toolbar = editor.getExtensionByName('toolbar');

            expect(toolbar).toBeUndefined();

            selectElementContents(this.el);
            editor.checkSelection();
        });
    });

    describe('Scroll', function () {
        it('should position static + sticky toolbar', function () {
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        sticky: true
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');
            spyOn(MediumEditor.extensions.toolbar.prototype, 'positionToolbarIfShown');
            fireEvent(window, 'scroll');
            expect(toolbar.positionToolbarIfShown).toHaveBeenCalled();
        });
    });

    describe('Resizing', function () {
        beforeEach(function () {
            this.el.innerHTML = 'test content';
        });

        it('should reset toolbar position', function () {
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar');
            selectElementContentsAndFire(editor.elements[0]);
            jasmine.clock().tick(1);
            expect(toolbar.getToolbarElement().className.indexOf('active')).toBeGreaterThan(-1);
            spyOn(toolbar, 'setToolbarPosition');
            fireEvent(window, 'resize');
            jasmine.clock().tick(1);
            expect(toolbar.setToolbarPosition).toHaveBeenCalled();
        });

        it('should not call setToolbarPosition when toolbar is not visible', function () {
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar');
            spyOn(toolbar, 'setToolbarPosition').and.callThrough();
            fireEvent(window, 'resize');
            jasmine.clock().tick(1);
            expect(toolbar.getToolbarElement().className.indexOf('active')).toBe(-1);
            expect(toolbar.setToolbarPosition).not.toHaveBeenCalled();
        });

        it('should throttle multiple calls to position toolbar', function () {
            var editor = this.newMediumEditor('.editor'),
                toolbar = editor.getExtensionByName('toolbar'),
                tickTime = 60,
                totalTicks;

            selectElementContentsAndFire(editor.elements[0]);
            jasmine.clock().tick(1);
            expect(toolbar.getToolbarElement().className.indexOf('active')).toBeGreaterThan(-1);

            spyOn(toolbar, 'setToolbarPosition').and.callThrough();
            for (totalTicks = 0; totalTicks < tickTime; totalTicks += 10) {
                fireEvent(window, 'resize');
                jasmine.clock().tick(10);
            }
            expect(toolbar.setToolbarPosition.calls.count()).toBeLessThan(3);
        });
    });

    describe('Static & sticky toolbar position', function () {
        it('should position static + sticky toolbar on the left', function () {
            this.el.innerHTML = '<b>lorem ipsum</b>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        sticky: true,
                        align: 'left'
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar').getToolbarElement();

            selectElementContentsAndFire(this.el.querySelector('b'));
            window.getSelection().getRangeAt(0).collapse(false);
            editor.checkSelection();
            jasmine.clock().tick(1); // checkSelection delay

            expect(toolbar.style.left).not.toBe('');
        });

        it('should position static + sticky toolbar on the right', function () {
            this.el.innerHTML = '<b>lorem ipsum</b>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        sticky: true,
                        align: 'right'
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar').getToolbarElement();

            selectElementContentsAndFire(this.el.querySelector('b'));
            window.getSelection().getRangeAt(0).collapse(false);
            editor.checkSelection();
            jasmine.clock().tick(1); // checkSelection delay

            expect(toolbar.style.left).not.toBe('');
        });

        it('should position static + sticky toolbar on the center', function () {
            this.el.innerHTML = '<b>lorem ipsum</b>';
            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        static: true,
                        sticky: true,
                        align: 'center'
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar').getToolbarElement();

            selectElementContentsAndFire(this.el.querySelector('b'));
            window.getSelection().getRangeAt(0).collapse(false);
            editor.checkSelection();
            jasmine.clock().tick(1); // checkSelection delay

            expect(toolbar.style.left).not.toBe('');
        });
    });

    describe('Relative Toolbars', function () {
        it('should contain relative toolbar class', function () {
            var relativeContainer = window.document.createElement('div');
            relativeContainer.setAttribute('id', 'someRelativeDiv');
            window.document.body.appendChild(relativeContainer);

            var editor = this.newMediumEditor('.editor', {
                    toolbar: {
                        relativeContainer: document.getElementById('someRelativeDiv')
                    }
                }),
                toolbar = editor.getExtensionByName('toolbar');

            expect(toolbar.getToolbarElement().classList.contains('medium-editor-relative-toolbar')).toBe(true);
        });

        it('should be included in relative node', function () {
            var relativeContainer = window.document.createElement('div');
            relativeContainer.setAttribute('id', 'someRelativeDiv');
            window.document.body.appendChild(relativeContainer);

            var editor = this.newMediumEditor('.editor', {
                  toolbar: {
                      relativeContainer: document.getElementById('someRelativeDiv')
                  }
              }),
              toolbarHTML = editor.getExtensionByName('toolbar').getToolbarElement().outerHTML;

            expect(document.getElementById('someRelativeDiv').innerHTML).toBe(toolbarHTML);
        });
    });
});

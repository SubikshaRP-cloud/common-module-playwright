const { test } = require('@playwright/test');

const CommonNavigation = require('../pages/CommonNavigation');


test(
    'Common Module - Trade Terms Add Search Edit Clear',
    async ({ page }) => {


        // ==========================================
        // TEST DATA (change code before each run - duplicates are rejected)
        // ==========================================

        const data = {
            code: 'UR',
            description: 'UR Created',
            updatedDescription: 'UR Updated'
        };


        console.log(
            'Trade Terms Data:',
            data
        );


        // ==========================================
        // HELPERS - EXACT CODE MATCHING
        // "FR" must NOT match a row whose description
        // merely contains "fr" (e.g. C&F = Cost and Freight)
        // ==========================================

        function escapeRegExp(text) {
            return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        const exactCode = new RegExp(
            `^\\s*${escapeRegExp(data.code)}\\s*$`,
            'i'
        );

        // Any cell whose WHOLE text equals the code
        function exactCodeCellIn(scope) {
            return scope
                .locator('[role="gridcell"], [role="rowheader"], td')
                .filter({
                    hasText: exactCode
                });
        }


        // ==========================================
        // LOGIN
        // ==========================================

        await page.goto(
            'https://dowellapps.com:8443/ords/r/manerp/common/login',
            {
                waitUntil: 'domcontentloaded'
            }
        );


        await page.getByRole(
            'textbox',
            {
                name: 'Username'
            }
        ).fill(
            'Subiksha'
        );


        await page.getByRole(
            'textbox',
            {
                name: 'Password'
            }
        ).fill(
            'Subiksha@4321'
        );


        await page.getByRole(
            'button',
            {
                name: 'Sign In',
                exact: true
            }
        ).click();


        console.log(
            'Login successful'
        );


        // ==========================================
        // SWITCH ROLE
        // ==========================================

        const switchRoleBtn =
            page
                .locator(
                    'li.a-switchRole button'
                )
                .first();


        const commonMenuItem =
            page.getByRole(
                'menuitem',
                {
                    name: 'COMMON ONLY - Mannai'
                }
            );


        await switchRoleBtn.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await switchRoleBtn.click();


        // ==========================================
        // WAIT FOR COMMON ROLE MENU
        // ==========================================

        let menuOpened =
            await commonMenuItem
                .waitFor({
                    state: 'visible',
                    timeout: 5000
                })
                .then(() => true)
                .catch(() => false);


        if (!menuOpened) {

            console.log(
                'Switch Role menu did not open. Retrying...'
            );


            await switchRoleBtn.click();


            await commonMenuItem.waitFor({
                state: 'visible',
                timeout: 30000
            });
        }


        // ==========================================
        // SELECT COMMON ROLE
        // ==========================================

        await commonMenuItem.click();


        console.log(
            'COMMON ONLY - Mannai selected'
        );


        await page.waitForTimeout(
            1500
        );


        // ==========================================
        // NAVIGATE TO TRADE TERMS
        // ==========================================

        const nav =
            new CommonNavigation(page);


        await nav.open(
            'Trade Terms'
        );


        console.log(
            'Trade Terms screen opened'
        );


        // ==========================================
        // ADD NEW TRADE TERMS
        // ==========================================

        console.log(
            '======================================'
        );

        console.log(
            'TRADE TERMS - ADD'
        );

        console.log(
            '======================================'
        );


        // ==========================================
        // CLEAR EXISTING SEARCH
        // ==========================================

        const clearButton =
            page.getByRole(
                'button',
                {
                    name: 'Clear',
                    exact: true
                }
            ).first();


        if (
            await clearButton
                .isVisible()
                .catch(() => false)
        ) {

            await clearButton.click();


            await page.waitForTimeout(
                500
            );


            console.log(
                'Previous search cleared'
            );
        }


        // ==========================================
        // CLICK NEW
        // ==========================================

        const newButton =
            page.getByRole(
                'button',
                {
                    name: 'New',
                    exact: true
                }
            );


        await newButton.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await newButton.click();


        console.log(
            'New button clicked'
        );


        // ==========================================
        // TRADE TERMS IFRAME
        // ==========================================

        const tradeTermsIframe =
            page.locator(
                'iframe[title="Trade Terms"]'
            ).first();


        await tradeTermsIframe.waitFor({
            state: 'visible',
            timeout: 30000
        });


        const frame =
            tradeTermsIframe.contentFrame();


        console.log(
            'Trade Terms iframe opened'
        );


        // ==========================================
        // ENTER CODE
        // ==========================================

        const codeField =
            frame.getByRole(
                'textbox',
                {
                    name: 'Code',
                    exact: true
                }
            );


        await codeField.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await codeField.fill(
            data.code
        );


        console.log(
            `Trade Terms Code: ${data.code}`
        );


        // ==========================================
        // ENTER DESCRIPTION
        // ==========================================

        const descriptionField =
            frame.getByRole(
                'textbox',
                {
                    name: 'Description',
                    exact: true
                }
            );


        await descriptionField.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await descriptionField.fill(
            data.description
        );


        console.log(
            `Trade Terms Description: ${data.description}`
        );


        // ==========================================
        // SAVE TRADE TERMS
        // ==========================================

        const saveButton =
            frame.getByRole(
                'button',
                {
                    name: 'Save',
                    exact: true
                }
            );


        await saveButton.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await saveButton.click();


        console.log(
            'Trade Terms Save clicked'
        );


        // ==========================================
        // WAIT FOR SAVE PROCESSING
        // ==========================================

        await page.waitForTimeout(
            1500
        );


        // ==========================================
        // CHECK WHETHER POPUP IS STILL OPEN
        // ==========================================

        const popupStillOpen =
            await tradeTermsIframe
                .isVisible()
                .catch(() => false);


        if (popupStillOpen) {

            console.log(
                'Trade Terms popup is still open after Save'
            );


            const popupText =
                await frame
                    .locator('body')
                    .innerText()
                    .catch(() => '');


            console.log(
                '======================================'
            );

            console.log(
                'TRADE TERMS POPUP TEXT'
            );

            console.log(
                '======================================'
            );

            console.log(
                popupText
            );

            console.log(
                '======================================'
            );


            // ------------------------------------------
            // CLOSE POPUP IF SAVE WAS SUCCESSFUL BUT
            // APPLICATION DID NOT AUTO-CLOSE IT
            // ------------------------------------------

            const visibleTradeTermsDialog =
                page
                    .locator(
                        '.ui-dialog:visible'
                    )
                    .filter({
                        has: page.locator(
                            'iframe[title="Trade Terms"]'
                        )
                    })
                    .first();


            if (
                await visibleTradeTermsDialog.count()
            ) {

                const closeButton =
                    visibleTradeTermsDialog.locator(
                        '.ui-dialog-titlebar-close'
                    );


                if (
                    await closeButton
                        .isVisible()
                        .catch(() => false)
                ) {

                    await closeButton.click();


                    console.log(
                        'Trade Terms popup closed using X'
                    );
                }
            }
        }


        console.log(
            'Trade Terms save processing completed'
        );


        // ==========================================
        // WAIT FOR OVERLAY
        // ==========================================

        const overlay =
            page.locator(
                '.ui-widget-overlay.ui-front'
            );


        if (
            await overlay.count()
        ) {

            await overlay
                .first()
                .waitFor({
                    state: 'hidden',
                    timeout: 15000
                })
                .catch(() => {});
        }


        await page.waitForTimeout(
            1000
        );


        // ==========================================
        // SEARCH TRADE TERMS
        // ==========================================

        console.log(
            '======================================'
        );

        console.log(
            'TRADE TERMS - SEARCH'
        );

        console.log(
            '======================================'
        );


        const tradeTermsCombobox =
            page.getByRole(
                'combobox',
                {
                    name: 'Trade Terms',
                    exact: true
                }
            );


        await tradeTermsCombobox.waitFor({
            state: 'visible',
            timeout: 30000
        });


        // IMPORTANT:
        // Do NOT use fill() on this combobox.
        // It is readonly.
        // Click it and enter value in Search dialog.

        await tradeTermsCombobox.click();


        console.log(
            'Trade Terms search opened'
        );


        // ==========================================
        // SEARCH DIALOG
        // ==========================================

        const searchDialog =
            page.getByRole(
                'dialog',
                {
                    name: 'Search'
                }
            );


        await searchDialog.waitFor({
            state: 'visible',
            timeout: 30000
        });


        console.log(
            'Trade Terms Search dialog opened'
        );


        // ==========================================
        // SEARCH TEXTBOX
        // ==========================================

        const searchTextbox =
            searchDialog.getByRole(
                'textbox'
            ).first();


        await searchTextbox.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await searchTextbox.fill(
            data.code
        );


        await searchTextbox.press(
            'Enter'
        );


        console.log(
            `Searching Trade Terms Code: ${data.code}`
        );


        // ==========================================
        // SELECT EXACT TRADE TERMS FROM SEARCH RESULT
        // ==========================================

        console.log(
            `Waiting for Trade Terms result: ${data.code}`
        );


        const tradeTermsResult =
            exactCodeCellIn(searchDialog).first();


        try {

            await tradeTermsResult.waitFor({
                state: 'visible',
                timeout: 10000
            });


            await tradeTermsResult.click();


            console.log(
                `Trade Terms selected (exact match): ${data.code}`
            );

        } catch {

            console.log(
                `Exact Trade Terms "${data.code}" not found in search dialog. Dialog content was:`
            );


            console.log(
                await searchDialog.innerText().catch(() => '(unreadable)')
            );


            throw new Error(
                `Trade Terms "${data.code}" not found in search dialog`
            );
        }


        // ==========================================
        // MAIN SEARCH
        // ==========================================

        const mainSearchButton =
            page.getByRole(
                'button',
                {
                    name: 'Search',
                    exact: true
                }
            );


        await mainSearchButton.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await mainSearchButton.click();


        console.log(
            'Trade Terms Search button clicked'
        );


        // ==========================================
        // WAIT FOR SEARCH RESULT
        // ==========================================

        await page.waitForTimeout(
            1000
        );


        // ==========================================
        // FIND EXACT TRADE TERMS ROW
        // (row that has a cell equal to the code - not just containing it)
        // ==========================================

        const tradeTermsRow =
            page.getByRole(
                'row'
            ).filter({
                has: page
                    .locator('[role="gridcell"], [role="rowheader"], td')
                    .filter({
                        hasText: exactCode
                    })
            }).first();


        await tradeTermsRow.waitFor({
            state: 'visible',
            timeout: 30000
        });


        const resultRowText =
            await tradeTermsRow.innerText();


        console.log(
            `Trade Terms result row: ${resultRowText.replace(/\s+/g, ' ').trim()}`
        );


        console.log(
            `Trade Terms record found: ${data.code}`
        );


        // ==========================================
        // EDIT TRADE TERMS (inside the SAME exact row only)
        // ==========================================

        const editLink =
            tradeTermsRow.getByRole(
                'link',
                {
                    name: 'Edit',
                    exact: true
                }
            );


        await editLink.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await editLink.click();


        console.log(
            'Trade Terms Edit clicked'
        );


        await page.waitForTimeout(
            1000
        );


        // ==========================================
        // TRADE TERMS EDIT IFRAME
        // ==========================================

        const editTradeTermsIframe =
            page.locator(
                'iframe[title="Trade Terms"]'
            ).first();


        await editTradeTermsIframe.waitFor({
            state: 'visible',
            timeout: 30000
        });


        const editFrame =
            editTradeTermsIframe.contentFrame();


        console.log(
            'Trade Terms edit iframe opened'
        );


        // ==========================================
        // VERIFY CODE
        // ==========================================

        const editCodeField =
            editFrame.getByRole(
                'textbox',
                {
                    name: 'Code',
                    exact: true
                }
            );


        await editCodeField.waitFor({
            state: 'visible',
            timeout: 30000
        });


        const openedCode =
            await editCodeField.inputValue();


        console.log(
            `Opened Trade Terms Code: ${openedCode}`
        );


        if (
            openedCode
                .trim()
                .toUpperCase() !==
            data.code
                .trim()
                .toUpperCase()
        ) {

            throw new Error(
                `Wrong Trade Terms opened. Expected "${data.code}" but found "${openedCode}"`
            );
        }


        console.log(
            `Correct Trade Terms opened: ${data.code}`
        );


        // ==========================================
        // UPDATE DESCRIPTION
        // ==========================================

        const editDescriptionField =
            editFrame.getByRole(
                'textbox',
                {
                    name: 'Description',
                    exact: true
                }
            );


        await editDescriptionField.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await editDescriptionField.fill(
            data.updatedDescription
        );


        console.log(
            `Updated Description: ${data.updatedDescription}`
        );


        // ==========================================
        // UPDATE TRADE TERMS
        // ==========================================

        const updateButton =
            editFrame.getByRole(
                'button',
                {
                    name: 'Update',
                    exact: true
                }
            );


        await updateButton.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await updateButton.click();


        console.log(
            'Trade Terms Update clicked'
        );


        // ==========================================
        // WAIT FOR UPDATE PROCESSING
        // ==========================================

        await page.waitForTimeout(
            1500
        );


        // ==========================================
        // CHECK UPDATE POPUP
        // ==========================================

        const editPopupStillOpen =
            await editTradeTermsIframe
                .isVisible()
                .catch(() => false);


        if (editPopupStillOpen) {

            console.log(
                'Trade Terms edit popup is still open after Update'
            );


            const popupText =
                await editFrame
                    .locator('body')
                    .innerText()
                    .catch(() => '');


            console.log(
                '======================================'
            );

            console.log(
                'TRADE TERMS POPUP AFTER UPDATE'
            );

            console.log(
                '======================================'
            );

            console.log(
                popupText
            );

            console.log(
                '======================================'
            );


            // ------------------------------------------
            // CLOSE POPUP IF REQUIRED
            // ------------------------------------------

            const visibleEditDialog =
                page
                    .locator(
                        '.ui-dialog:visible'
                    )
                    .filter({
                        has: page.locator(
                            'iframe[title="Trade Terms"]'
                        )
                    })
                    .first();


            if (
                await visibleEditDialog.count()
            ) {

                const closeEditButton =
                    visibleEditDialog.locator(
                        '.ui-dialog-titlebar-close'
                    );


                if (
                    await closeEditButton
                        .isVisible()
                        .catch(() => false)
                ) {

                    await closeEditButton.click();


                    console.log(
                        'Trade Terms edit popup closed using X'
                    );
                }
            }

        } else {

            console.log(
                'Trade Terms updated successfully'
            );
        }


        // ==========================================
        // WAIT FOR UPDATE OVERLAY
        // ==========================================

        const updateOverlay =
            page.locator(
                '.ui-widget-overlay.ui-front'
            );


        if (
            await updateOverlay.count()
        ) {

            await updateOverlay
                .first()
                .waitFor({
                    state: 'hidden',
                    timeout: 15000
                })
                .catch(() => {});
        }


        await page.waitForTimeout(
            1000
        );


        // ==========================================
        // CLEAR
        // ==========================================

        console.log(
            '======================================'
        );

        console.log(
            'TRADE TERMS - CLEAR'
        );

        console.log(
            '======================================'
        );


        const finalClearButton =
            page.getByRole(
                'button',
                {
                    name: 'Clear',
                    exact: true
                }
            ).first();


        await finalClearButton.waitFor({
            state: 'visible',
            timeout: 30000
        });


        await finalClearButton.click();


        console.log(
            'Trade Terms search cleared'
        );


        // ==========================================
        // TEST COMPLETED
        // ==========================================

        console.log(
            '======================================'
        );

        console.log(
            'TRADE TERMS TEST COMPLETED SUCCESSFULLY'
        );

        console.log(
            '======================================'
        );

    }
);
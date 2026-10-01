class CommonNavigation {

    constructor(page) {
        this.page = page;
    }

    async openCommonModule() {

        console.log('======================================');
        console.log('OPEN COMMON NAVIGATION');
        console.log('======================================');

        const navButton = this.page.locator(
            '#t_Button_navControl'
        );

        await navButton.waitFor({
            state: 'visible',
            timeout: 30000
        });

        console.log('Navigation button visible');

        let commonMenu = this.page
            .locator('[role="treeitem"], .a-TreeView-node')
            .filter({
                hasText: /^\s*Common\s*$/i
            })
            .first();

        if (!(await commonMenu.isVisible().catch(() => false))) {

            console.log('Opening left navigation');

            await navButton.click({
                force: true
            });

            await this.page.waitForTimeout(1500);
        }

        commonMenu = this.page
            .locator('[role="treeitem"], .a-TreeView-node')
            .filter({
                hasText: /^\s*Common\s*$/i
            })
            .first();

        await commonMenu.waitFor({
            state: 'visible',
            timeout: 30000
        });

        console.log('Common menu visible');

        await commonMenu.click();

        await this.page.waitForTimeout(1000);

        console.log('Common menu opened');
    }

    async open(screenName) {

        await this.openCommonModule();

        console.log(`Opening screen: ${screenName}`);

        let screen = this.page
            .getByRole('treeitem')
            .filter({
                hasText: new RegExp(`^${screenName}\\s*$`, 'i')
            })
            .first();

        if (!(await screen.count())) {
            screen = this.page.getByText(screenName, { exact: false }).first();
        }

        await screen.waitFor({
            state: 'visible',
            timeout: 30000
        });

        console.log(`${screenName} menu visible`);

        await screen.click({ force: true });

        await this.page.waitForTimeout(1500);

        console.log(`${screenName} screen opened`);
    }
}

module.exports = CommonNavigation;
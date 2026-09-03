export async function createDesktopSession({ adapter, platform }) {
  const saved = await platform.save.load();
  const session = {
    state: saved || adapter.createState(),
    async save() {
      await platform.save.write(adapter.snapshot(this.state));
    },
    async newGame() {
      await platform.save.clear();
      this.state = adapter.createState();
      return this.state;
    }
  };
  return session;
}

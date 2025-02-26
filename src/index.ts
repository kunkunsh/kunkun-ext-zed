import {
  expose,
  List,
  fs,
  shell,
  TemplateUiCommand,
  toast,
  path,
  ui,
  os,
  IconEnum,
  Icon,
} from "@kksh/api/ui/template";
import { API } from "./api.types.ts";

async function getDbPath() {
  const homePath = await path.homeDir();
  const platform = await os.platform();
  if (platform === "macos") {
    return await path.join(
      homePath,
      "Library/Application Support/Zed/db/0-stable/db.sqlite"
    );
  } else if (platform === "linux") {
    return await path.join(homePath, ".config/zed/db/0-stable/db.sqlite");
  } else if (platform === "windows") {
    return await path.join(homePath, "AppData/Local/Zed/db/0-stable/db.sqlite");
  } else {
    throw new Error("Unsupported platform");
  }
}

async function getRecentProjects() {
  const dbPath = await getDbPath();
  console.log(dbPath);
  const { rpcChannel, process, command } = await shell.createDenoRpcChannel<
    object,
    API
  >(
    "$EXTENSION/deno-src/index.ts",
    [],
    {
      allowRead: [dbPath],
      allowWrite: [dbPath],
    },
    {}
  );
  command.stderr.on("data", (data) => {
    console.error("stderr", data);
  });
  command.stdout.on("data", (data) => {
    console.log("stdout", data);
  });
  const api = rpcChannel.getAPI();
  const result = await api.getRecentProjects(dbPath);
  await process.kill();
  return result;
}

function openWithZed(path: string) {
  return shell
    .hasCommand("zed")
    .then((hasCommand) => {
      if (!hasCommand) {
        return toast.error(
          "zed command not installed to PATH, please install it the 'zed' command."
        );
      } else {
        return shell
          .createCommand("zed", [path])
          .execute()
          .then((res) => {
            toast.success(`Opened with Zed`);
          })
          .catch((err) => {
            toast.error(`Failed to open with Zed: ${err}`);
          });
      }
    })
    .catch((err) => {
      toast.error(`${err}`);
    });
}

class ExtensionTemplate extends TemplateUiCommand {
  load() {
    ui.setSearchBarPlaceholder(
      "Enter a search term, and press enter to search"
    );
    ui.render(
      new List.List({
        items: [],
      })
    );
    return getRecentProjects()
      .then(async (projects) => {
        // filter out non-existent projects
        const filteredProjects = await Promise.all(
          projects.map(async (p) => {
            const exists = await fs.exists(p).catch(() => false);
            const basename = await path.basename(p).catch(() => null);
            return exists && basename ? { path: p, basename } : null;
          })
        ).then((projects) => projects.filter((p) => p !== null));
        // get basename for each project with path.basename

        ui.render(
          new List.List({
            items: filteredProjects.map(
              (p) =>
                new List.Item({
                  title: p.basename,
                  subTitle: p.path,
                  value: p.path,
                  icon: new Icon({
                    type: IconEnum.Iconify,
                    value: "material-symbols:folder-outline",
                  }),
                })
            ),
            defaultAction: "Open With Zed",
          })
        );
      })
      .catch((err) => {
        toast.error("Failed to get recent projects", {
          description: err.message,
        });
        console.error(err);
      });
  }
  override onListItemSelected(value: string): Promise<void> {
    return openWithZed(value);
  }
}

expose(new ExtensionTemplate());

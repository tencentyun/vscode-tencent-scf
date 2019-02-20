import { WorkspaceFolder, Uri, workspace, window } from "vscode";

let currentUri: Uri;
async function determineWorkspaceFolder(
  currentUri: Uri
): Promise<WorkspaceFolder | undefined> {
  if (currentUri) {
    return workspace.getWorkspaceFolder(currentUri);
  }

  const workspaceFolders = workspace.workspaceFolders;
  let workspaceFolder: WorkspaceFolder | undefined;
  if (workspaceFolders && workspaceFolders.length === 1) {
    workspaceFolder = workspaceFolders[0];
  }

  const selectedWorkspaceFolder =
    workspaceFolder || (await window.showWorkspaceFolderPick());

  if (selectedWorkspaceFolder !== undefined) {
    currentUri = selectedWorkspaceFolder.uri;
  }
  return selectedWorkspaceFolder;
}

function getRootPathFromWorkspace(
  currentWorkspace?: WorkspaceFolder
): string | undefined | null {
  if (typeof currentWorkspace === "undefined") {
    return undefined;
  }

  if (currentWorkspace.uri.scheme !== "file") {
    return null;
  }

  return currentWorkspace.uri.fsPath;
}

export async function determineWorkspaceRoot(): Promise<string> {
  const currentWorkspace = await determineWorkspaceFolder(currentUri);
  const workspaceRoot = getRootPathFromWorkspace(currentWorkspace);
  if (!workspaceRoot) {
    throw new Error(
      "This extension currently only support file system workspaces."
    );
  }
  return workspaceRoot;
}

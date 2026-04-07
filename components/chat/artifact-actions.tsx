import { memo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { artifactDefinitions, type UIArtifact } from "./artifact";
import type {
  ArtifactActionContext,
  LocalizedText,
} from "./create-artifact";

type ArtifactActionsProps = {
  artifact: UIArtifact;
  handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: "edit" | "diff";
  metadata: ArtifactActionContext["metadata"];
  setMetadata: ArtifactActionContext["setMetadata"];
};

function PureArtifactActions({
  artifact,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  metadata,
  setMetadata,
}: ArtifactActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();
  const resolveText = (text: LocalizedText) =>
    typeof text === "function" ? text(t) : text;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind
  );

  if (!artifactDefinition) {
    throw new Error("Artifact definition not found!");
  }

  const actionContext: ArtifactActionContext = {
    content: artifact.content,
    handleVersionChange,
    currentVersionIndex,
    isCurrentVersion,
    mode,
    metadata,
    setMetadata,
    t,
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      {artifactDefinition.actions.map((action) => {
        const description = resolveText(action.description);
        const disabled =
          isLoading || artifact.status === "streaming"
            ? true
            : action.isDisabled
              ? action.isDisabled(actionContext)
              : false;

        return (
          <Tooltip key={action.id ?? description}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center rounded-full p-3 text-muted-foreground transition-all duration-150",
                  "hover:text-foreground",
                  "active:scale-95",
                  "disabled:pointer-events-none disabled:opacity-30",
                  {
                    "text-foreground": mode === "diff" && action.id === "view-changes",
                  }
                )}
                disabled={disabled}
                onClick={async () => {
                  setIsLoading(true);

                  try {
                    await Promise.resolve(action.onClick(actionContext));
                  } catch (_error) {
                    toast.error(t("chat.artifact.failedExecuteAction"));
                  } finally {
                    setIsLoading(false);
                  }
                }}
                type="button"
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              {description}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export const ArtifactActions = memo(
  PureArtifactActions,
  (prevProps, nextProps) => {
    if (prevProps.artifact.status !== nextProps.artifact.status) {
      return false;
    }
    if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
      return false;
    }
    if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) {
      return false;
    }
    if (prevProps.artifact.content !== nextProps.artifact.content) {
      return false;
    }
    if (prevProps.mode !== nextProps.mode) {
      return false;
    }

    return true;
  }
);

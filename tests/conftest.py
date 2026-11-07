import sys
import importlib.util
from pathlib import Path

root_path = Path(__file__).resolve().parent.parent
if str(root_path) not in sys.path:
    sys.path.insert(0, str(root_path))

class HyphenImporter:
    """Allows importing 'services.alert_service' and 'services.escalation_service'
    from hyphenated directories without needing filesystem symlinks that break npm workspaces."""
    mapping = {
        "services.alert_service": root_path / "services" / "alert-service",
        "services.escalation_service": root_path / "services" / "escalation-service",
    }

    def find_spec(self, fullname, path, target=None):
        for prefix, dirpath in self.mapping.items():
            if fullname == prefix:
                init_file = dirpath / "__init__.py"
                return importlib.util.spec_from_file_location(
                    fullname,
                    str(init_file),
                    submodule_search_locations=[str(dirpath)]
                )
            elif fullname.startswith(prefix + "."):
                sub = fullname[len(prefix) + 1:].replace(".", "/")
                py_file = dirpath / f"{sub}.py"
                init_file = dirpath / sub / "__init__.py"
                if py_file.exists():
                    return importlib.util.spec_from_file_location(fullname, str(py_file))
                elif init_file.exists():
                    return importlib.util.spec_from_file_location(
                        fullname,
                        str(init_file),
                        submodule_search_locations=[str(dirpath / sub)]
                    )
        return None

sys.meta_path.insert(0, HyphenImporter())

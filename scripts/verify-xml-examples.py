"""Check XML syntax; optionally compare excerpts to an unpacked source package.

Input: compiled rules.json on stdin. This is not an NDK/XML Schema validator.
Only Python's built-in XML parser is used; no network or file writes.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET


def parse_xml(content):
    if b"<!DOCTYPE" in content.upper() or b"<!ENTITY" in content.upper():
        raise ValueError("DTD/entity declarations are not allowed in examples or source XML")
    return ET.fromstring(content)


def structure(node):
    # Ignore indentation only; preserve element/attribute names and data values.
    return (node.tag, sorted(node.attrib.items()), (node.text or "").strip(),
            [(structure(child), (child.tail or "").strip()) for child in node])


def verify(rules, source_root=None):
    checked = 0
    for rule in rules:
        for example in rule.get("examples", []):
            try:
                excerpt = parse_xml(example["code"].encode("utf-8"))
                if source_root is not None:
                    root = source_root.resolve()
                    source_file = (root / example["file_path"]).resolve()
                    if not source_file.is_relative_to(root):
                        raise ValueError("Source path escapes the selected package")
                    raw = source_file.read_bytes()
                    if hashlib.sha256(raw).hexdigest() != example["file_sha256"]:
                        raise ValueError("Source SHA-256 mismatch")
                    document = parse_xml(raw)
                    xpath = example["source_xpath"]
                    # Prefixing a document-root wrapper supports the absolute child
                    # paths and attribute predicates used by these source excerpts.
                    if not xpath.startswith("/") or xpath.startswith("//"):
                        raise ValueError("Expected an absolute child XPath")
                    wrapper = ET.Element("document")
                    wrapper.append(document)
                    matches = wrapper.findall("." + xpath, example["namespaces"])
                    if len(matches) != 1:
                        raise ValueError(f"XPath selected {len(matches)} nodes, expected one")
                    if structure(matches[0]) != structure(excerpt):
                        raise ValueError("XML excerpt differs from selected source node")
                checked += 1
            except (ValueError, OSError, ET.ParseError, SyntaxError) as error:
                raise ValueError(f"{rule['rule_id']} / {example['id']}: {error}") from error
    return checked


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path)
    args = parser.parse_args()
    try:
        count = verify(json.loads(sys.stdin.buffer.read().decode("utf-8-sig")), args.source_root)
    except (ValueError, KeyError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    print(json.dumps({"examples": count, "xml_syntax": "ok", "source_comparison": "ok" if args.source_root else "not_requested"}))

# keel_api/src/modules/media/panel_grid.py

"""Grid layout validation and reflow helpers for media panels."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from core.errors import AppError

ResizeEdge = Literal["n", "s", "e", "w", "ne", "nw", "se", "sw"]

DEFAULT_FIRST_ITEM_COL_SPAN = 12
DEFAULT_FIRST_ITEM_ROW_SPAN = 4
DEFAULT_APPEND_ROW_SPAN = 3


@dataclass(frozen=True)
class PanelPlacement:
    """One tile on a panel grid."""

    id: str
    grid_x: int
    grid_y: int
    col_span: int
    row_span: int


def rect_end_x(item: PanelPlacement) -> int:
    """Return exclusive east column bound."""
    return item.grid_x + item.col_span


def rect_end_y(item: PanelPlacement) -> int:
    """Return exclusive south row bound."""
    return item.grid_y + item.row_span


def assert_fits_container(item: PanelPlacement, column_count: int) -> None:
    """Ensure a tile stays within horizontal bounds."""
    if item.grid_x < 0 or item.grid_y < 0:
        raise AppError("Tile position must be non-negative.", status_code=400)
    if item.col_span < 1 or item.row_span < 1:
        raise AppError("Tile span must be at least 1.", status_code=400)
    if rect_end_x(item) > column_count:
        raise AppError("Tile extends past panel width.", status_code=400)


def assert_packed_layout(items: list[PanelPlacement], column_count: int) -> None:
    """Validate no overlaps, no gaps, and all tiles fit the container."""
    if not items:
        return

    for item in items:
        assert_fits_container(item, column_count)

    max_row = max(rect_end_y(item) for item in items)
    occupied: set[tuple[int, int]] = set()
    for item in items:
        for row in range(item.grid_y, rect_end_y(item)):
            for col in range(item.grid_x, rect_end_x(item)):
                if (col, row) in occupied:
                    raise AppError("Panel layout has overlapping tiles.", status_code=400)
                occupied.add((col, row))

    expected = column_count * max_row
    if len(occupied) != expected:
        raise AppError("Panel layout must be a tight partition with no gaps.", status_code=400)


def placements_from_records(rows: list) -> list[PanelPlacement]:
    """Map DB rows to PanelPlacement list."""
    return [
        PanelPlacement(
            id=str(row["id"]),
            grid_x=row["grid_x"],
            grid_y=row["grid_y"],
            col_span=row["col_span"],
            row_span=row["row_span"],
        )
        for row in rows
    ]


def to_placement_map(items: list[PanelPlacement]) -> dict[str, PanelPlacement]:
    """Index placements by id."""
    return {item.id: item for item in items}


def clone_items(items: list[PanelPlacement]) -> list[PanelPlacement]:
    """Return a mutable copy list."""
    return [
        PanelPlacement(
            id=item.id,
            grid_x=item.grid_x,
            grid_y=item.grid_y,
            col_span=item.col_span,
            row_span=item.row_span,
        )
        for item in items
    ]


def _items_touching_east(
    target: PanelPlacement,
    items: list[PanelPlacement],
) -> list[PanelPlacement]:
    east = rect_end_x(target)
    return [
        item
        for item in items
        if item.id != target.id
        and item.grid_x == east
        and item.grid_y < rect_end_y(target)
        and rect_end_y(item) > target.grid_y
    ]


def _items_touching_west(
    target: PanelPlacement,
    items: list[PanelPlacement],
) -> list[PanelPlacement]:
    return [
        item
        for item in items
        if item.id != target.id
        and rect_end_x(item) == target.grid_x
        and item.grid_y < rect_end_y(target)
        and rect_end_y(item) > target.grid_y
    ]


def _items_touching_south(
    target: PanelPlacement,
    items: list[PanelPlacement],
) -> list[PanelPlacement]:
    south = rect_end_y(target)
    return [
        item
        for item in items
        if item.id != target.id
        and item.grid_y == south
        and item.grid_x < rect_end_x(target)
        and rect_end_x(item) > target.grid_x
    ]


def _items_touching_north(
    target: PanelPlacement,
    items: list[PanelPlacement],
) -> list[PanelPlacement]:
    return [
        item
        for item in items
        if item.id != target.id
        and rect_end_y(item) == target.grid_y
        and item.grid_x < rect_end_x(target)
        and rect_end_x(item) > target.grid_x
    ]


def _apply_horizontal_delta(
    items: list[PanelPlacement],
    target_id: str,
    *,
    edge: Literal["e", "w"],
    delta_cols: int,
    column_count: int,
) -> list[PanelPlacement] | None:
    if delta_cols == 0:
        return items

    updated = clone_items(items)
    by_id = {item.id: item for item in updated}
    target = by_id[target_id]

    if edge == "e":
        if delta_cols > 0:
            neighbors = _items_touching_east(target, updated)
            if not neighbors:
                if rect_end_x(target) + delta_cols > column_count:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span + delta_cols,
                    row_span=target.row_span,
                )
            else:
                remaining = delta_cols
                for neighbor in sorted(neighbors, key=lambda item: item.grid_y):
                    if remaining <= 0:
                        break
                    can_take = neighbor.col_span - 1
                    take = min(remaining, can_take)
                    if take <= 0:
                        return None
                    neighbor_index = updated.index(neighbor)
                    updated[neighbor_index] = PanelPlacement(
                        id=neighbor.id,
                        grid_x=neighbor.grid_x + take,
                        grid_y=neighbor.grid_y,
                        col_span=neighbor.col_span - take,
                        row_span=neighbor.row_span,
                    )
                    remaining -= take
                if remaining > 0:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span + delta_cols,
                    row_span=target.row_span,
                )
        else:
            shrink = -delta_cols
            if target.col_span - shrink < 1:
                return None
            target = PanelPlacement(
                id=target.id,
                grid_x=target.grid_x,
                grid_y=target.grid_y,
                col_span=target.col_span - shrink,
                row_span=target.row_span,
            )
            neighbors = _items_touching_east(
                PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span,
                    row_span=target.row_span,
                ),
                updated,
            )
            if neighbors:
                neighbor = neighbors[0]
                neighbor_index = updated.index(neighbor)
                updated[neighbor_index] = PanelPlacement(
                    id=neighbor.id,
                    grid_x=neighbor.grid_x - shrink,
                    grid_y=neighbor.grid_y,
                    col_span=neighbor.col_span + shrink,
                    row_span=neighbor.row_span,
                )
    elif edge == "w":
        if delta_cols > 0:
            neighbors = _items_touching_west(target, updated)
            if not neighbors:
                if target.grid_x - delta_cols < 0:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x - delta_cols,
                    grid_y=target.grid_y,
                    col_span=target.col_span + delta_cols,
                    row_span=target.row_span,
                )
            else:
                remaining = delta_cols
                for neighbor in sorted(neighbors, key=lambda item: item.grid_y):
                    if remaining <= 0:
                        break
                    can_take = neighbor.col_span - 1
                    take = min(remaining, can_take)
                    if take <= 0:
                        return None
                    neighbor_index = updated.index(neighbor)
                    updated[neighbor_index] = PanelPlacement(
                        id=neighbor.id,
                        grid_x=neighbor.grid_x,
                        grid_y=neighbor.grid_y,
                        col_span=neighbor.col_span - take,
                        row_span=neighbor.row_span,
                    )
                    remaining -= take
                if remaining > 0:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x - delta_cols,
                    grid_y=target.grid_y,
                    col_span=target.col_span + delta_cols,
                    row_span=target.row_span,
                )
        else:
            shrink = -delta_cols
            if target.col_span - shrink < 1:
                return None
            target = PanelPlacement(
                id=target.id,
                grid_x=target.grid_x + shrink,
                grid_y=target.grid_y,
                col_span=target.col_span - shrink,
                row_span=target.row_span,
            )
            neighbors = _items_touching_west(
                PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span,
                    row_span=target.row_span,
                ),
                updated,
            )
            if neighbors:
                neighbor = neighbors[0]
                neighbor_index = updated.index(neighbor)
                updated[neighbor_index] = PanelPlacement(
                    id=neighbor.id,
                    grid_x=neighbor.grid_x,
                    grid_y=neighbor.grid_y,
                    col_span=neighbor.col_span + shrink,
                    row_span=neighbor.row_span,
                )

    target_index = next(index for index, item in enumerate(updated) if item.id == target_id)
    updated[target_index] = target
    try:
        assert_packed_layout(updated, column_count)
    except AppError:
        return None
    return updated


def _apply_vertical_delta(
    items: list[PanelPlacement],
    target_id: str,
    *,
    edge: Literal["n", "s"],
    delta_rows: int,
    column_count: int,
) -> list[PanelPlacement] | None:
    if delta_rows == 0:
        return items

    updated = clone_items(items)
    by_id = {item.id: item for item in updated}
    target = by_id[target_id]

    if edge == "s":
        if delta_rows > 0:
            neighbors = _items_touching_south(target, updated)
            if not neighbors:
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span,
                    row_span=target.row_span + delta_rows,
                )
            else:
                remaining = delta_rows
                for neighbor in sorted(neighbors, key=lambda item: item.grid_x):
                    if remaining <= 0:
                        break
                    can_take = neighbor.row_span - 1
                    take = min(remaining, can_take)
                    if take <= 0:
                        return None
                    neighbor_index = updated.index(neighbor)
                    updated[neighbor_index] = PanelPlacement(
                        id=neighbor.id,
                        grid_x=neighbor.grid_x,
                        grid_y=neighbor.grid_y + take,
                        col_span=neighbor.col_span,
                        row_span=neighbor.row_span - take,
                    )
                    remaining -= take
                if remaining > 0:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span,
                    row_span=target.row_span + delta_rows,
                )
        else:
            shrink = -delta_rows
            if target.row_span - shrink < 1:
                return None
            target = PanelPlacement(
                id=target.id,
                grid_x=target.grid_x,
                grid_y=target.grid_y,
                col_span=target.col_span,
                row_span=target.row_span - shrink,
            )
            neighbors = _items_touching_south(
                PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span,
                    row_span=target.row_span,
                ),
                updated,
            )
            if neighbors:
                neighbor = neighbors[0]
                neighbor_index = updated.index(neighbor)
                updated[neighbor_index] = PanelPlacement(
                    id=neighbor.id,
                    grid_x=neighbor.grid_x,
                    grid_y=neighbor.grid_y - shrink,
                    col_span=neighbor.col_span,
                    row_span=neighbor.row_span + shrink,
                )
    elif edge == "n":
        if delta_rows > 0:
            neighbors = _items_touching_north(target, updated)
            if not neighbors:
                if target.grid_y - delta_rows < 0:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y - delta_rows,
                    col_span=target.col_span,
                    row_span=target.row_span + delta_rows,
                )
            else:
                remaining = delta_rows
                for neighbor in sorted(neighbors, key=lambda item: item.grid_x):
                    if remaining <= 0:
                        break
                    can_take = neighbor.row_span - 1
                    take = min(remaining, can_take)
                    if take <= 0:
                        return None
                    neighbor_index = updated.index(neighbor)
                    updated[neighbor_index] = PanelPlacement(
                        id=neighbor.id,
                        grid_x=neighbor.grid_x,
                        grid_y=neighbor.grid_y,
                        col_span=neighbor.col_span,
                        row_span=neighbor.row_span - take,
                    )
                    remaining -= take
                if remaining > 0:
                    return None
                target = PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y - delta_rows,
                    col_span=target.col_span,
                    row_span=target.row_span + delta_rows,
                )
        else:
            shrink = -delta_rows
            if target.row_span - shrink < 1:
                return None
            target = PanelPlacement(
                id=target.id,
                grid_x=target.grid_x,
                grid_y=target.grid_y + shrink,
                col_span=target.col_span,
                row_span=target.row_span - shrink,
            )
            neighbors = _items_touching_north(
                PanelPlacement(
                    id=target.id,
                    grid_x=target.grid_x,
                    grid_y=target.grid_y,
                    col_span=target.col_span,
                    row_span=target.row_span,
                ),
                updated,
            )
            if neighbors:
                neighbor = neighbors[0]
                neighbor_index = updated.index(neighbor)
                updated[neighbor_index] = PanelPlacement(
                    id=neighbor.id,
                    grid_x=neighbor.grid_x,
                    grid_y=neighbor.grid_y,
                    col_span=neighbor.col_span,
                    row_span=neighbor.row_span + shrink,
                )

    target_index = next(index for index, item in enumerate(updated) if item.id == target_id)
    updated[target_index] = target
    try:
        assert_packed_layout(updated, column_count)
    except AppError:
        return None
    return updated


def apply_elastic_resize(
    items: list[PanelPlacement],
    target_id: str,
    *,
    edge: ResizeEdge,
    delta_cols: int,
    delta_rows: int,
    column_count: int,
) -> list[PanelPlacement] | None:
    """Resize one tile and reflow adjacent neighbors."""
    result = clone_items(items)
    if edge in {"e", "w", "ne", "nw", "se", "sw"} and delta_cols != 0:
        horizontal_edge: Literal["e", "w"] = "e" if edge in {"e", "ne", "se"} else "w"
        if edge in {"ne", "nw"}:
            horizontal_edge = "w"
        elif edge in {"se", "sw"}:
            horizontal_edge = "e"
        next_result = _apply_horizontal_delta(
            result,
            target_id,
            edge=horizontal_edge,
            delta_cols=delta_cols,
            column_count=column_count,
        )
        if next_result is None:
            return None
        result = next_result

    if edge in {"n", "s", "ne", "nw", "se", "sw"} and delta_rows != 0:
        vertical_edge: Literal["n", "s"] = "s" if edge in {"s", "se", "sw"} else "n"
        next_result = _apply_vertical_delta(
            result,
            target_id,
            edge=vertical_edge,
            delta_rows=delta_rows,
            column_count=column_count,
        )
        if next_result is None:
            return None
        result = next_result

    return result


def placement_for_new_item(
    items: list[PanelPlacement],
    column_count: int,
    *,
    col_span: int = DEFAULT_FIRST_ITEM_COL_SPAN,
    row_span: int = DEFAULT_APPEND_ROW_SPAN,
) -> PanelPlacement:
    """Compute placement when adding a new tile."""
    if not items:
        return PanelPlacement(
            id="",
            grid_x=0,
            grid_y=0,
            col_span=min(col_span, column_count),
            row_span=DEFAULT_FIRST_ITEM_ROW_SPAN,
        )

    max_row = max(rect_end_y(item) for item in items)
    return PanelPlacement(
        id="",
        grid_x=0,
        grid_y=max_row,
        col_span=column_count,
        row_span=row_span,
    )


def _expand_east_neighbors_into_removed(
    items: list[PanelPlacement],
    removed: PanelPlacement,
) -> list[PanelPlacement] | None:
    neighbors = _items_touching_east(removed, items)
    if not neighbors:
        return None

    updated = clone_items(items)
    delta = removed.col_span
    for neighbor in neighbors:
        index = next(item_index for item_index, item in enumerate(updated) if item.id == neighbor.id)
        current = updated[index]
        updated[index] = PanelPlacement(
            id=current.id,
            grid_x=current.grid_x - delta,
            grid_y=current.grid_y,
            col_span=current.col_span + delta,
            row_span=current.row_span,
        )
    return updated


def _expand_west_neighbors_into_removed(
    items: list[PanelPlacement],
    removed: PanelPlacement,
) -> list[PanelPlacement] | None:
    neighbors = _items_touching_west(removed, items)
    if not neighbors:
        return None

    updated = clone_items(items)
    delta = removed.col_span
    for neighbor in neighbors:
        index = next(item_index for item_index, item in enumerate(updated) if item.id == neighbor.id)
        current = updated[index]
        updated[index] = PanelPlacement(
            id=current.id,
            grid_x=current.grid_x,
            grid_y=current.grid_y,
            col_span=current.col_span + delta,
            row_span=current.row_span,
        )
    return updated


def _expand_north_neighbors_into_removed(
    items: list[PanelPlacement],
    removed: PanelPlacement,
) -> list[PanelPlacement] | None:
    neighbors = _items_touching_north(removed, items)
    if not neighbors:
        return None

    updated = clone_items(items)
    delta = removed.row_span
    for neighbor in neighbors:
        index = next(item_index for item_index, item in enumerate(updated) if item.id == neighbor.id)
        current = updated[index]
        updated[index] = PanelPlacement(
            id=current.id,
            grid_x=current.grid_x,
            grid_y=current.grid_y,
            col_span=current.col_span,
            row_span=current.row_span + delta,
        )
    return updated


def _expand_south_neighbors_into_removed(
    items: list[PanelPlacement],
    removed: PanelPlacement,
) -> list[PanelPlacement] | None:
    neighbors = _items_touching_south(removed, items)
    if not neighbors:
        return None

    updated = clone_items(items)
    delta = removed.row_span
    for neighbor in neighbors:
        index = next(item_index for item_index, item in enumerate(updated) if item.id == neighbor.id)
        current = updated[index]
        updated[index] = PanelPlacement(
            id=current.id,
            grid_x=current.grid_x,
            grid_y=current.grid_y - delta,
            col_span=current.col_span,
            row_span=current.row_span + delta,
        )
    return updated


def _expand_primary_neighbor_into_removed(
    items: list[PanelPlacement],
    removed: PanelPlacement,
) -> list[PanelPlacement] | None:
    updated = clone_items(items)
    neighbors = (
        _items_touching_east(removed, updated)
        + _items_touching_west(removed, updated)
        + _items_touching_south(removed, updated)
        + _items_touching_north(removed, updated)
    )
    if not neighbors:
        return None

    primary = max(
        neighbors,
        key=lambda item: item.col_span * item.row_span,
    )
    index = next(item_index for item_index, item in enumerate(updated) if item.id == primary.id)

    if primary.grid_x == removed.grid_x and primary.col_span == removed.col_span:
        if primary.grid_y < removed.grid_y:
            updated[index] = PanelPlacement(
                id=primary.id,
                grid_x=primary.grid_x,
                grid_y=primary.grid_y,
                col_span=primary.col_span,
                row_span=primary.row_span + removed.row_span,
            )
        else:
            updated[index] = PanelPlacement(
                id=primary.id,
                grid_x=primary.grid_x,
                grid_y=removed.grid_y,
                col_span=primary.col_span,
                row_span=primary.row_span + removed.row_span,
            )
    elif primary.grid_y == removed.grid_y and primary.row_span == removed.row_span:
        if primary.grid_x < removed.grid_x:
            updated[index] = PanelPlacement(
                id=primary.id,
                grid_x=primary.grid_x,
                grid_y=primary.grid_y,
                col_span=primary.col_span + removed.col_span,
                row_span=primary.row_span,
            )
        else:
            updated[index] = PanelPlacement(
                id=primary.id,
                grid_x=removed.grid_x,
                grid_y=primary.grid_y,
                col_span=primary.col_span + removed.col_span,
                row_span=primary.row_span,
            )
    else:
        return None

    return updated


def repack_panel_grid(
    items: list[PanelPlacement],
    column_count: int,
) -> list[PanelPlacement]:
    """Re-place tiles top-left in reading order while preserving each span."""
    if not items:
        return items

    ordered = sorted(items, key=lambda item: (item.grid_y, item.grid_x, item.id))
    occupied: set[tuple[int, int]] = set()
    repacked: list[PanelPlacement] = []
    total_area = sum(item.col_span * item.row_span for item in ordered)
    max_scan_y = max(
        max(item.row_span for item in ordered),
        (total_area + column_count - 1) // column_count + max(item.row_span for item in ordered),
    )

    for item in ordered:
        placed = False
        for y in range(max_scan_y + 1):
            for x in range(column_count):
                if x + item.col_span > column_count:
                    continue
                fits = True
                for row in range(y, y + item.row_span):
                    for col in range(x, x + item.col_span):
                        if (col, row) in occupied:
                            fits = False
                            break
                    if not fits:
                        break
                if not fits:
                    continue

                repacked.append(
                    PanelPlacement(
                        id=item.id,
                        grid_x=x,
                        grid_y=y,
                        col_span=item.col_span,
                        row_span=item.row_span,
                    )
                )
                for row in range(y, y + item.row_span):
                    for col in range(x, x + item.col_span):
                        occupied.add((col, row))
                placed = True
                break
            if placed:
                break

        if not placed:
            raise AppError("Unable to repack panel layout.", status_code=400)

    assert_packed_layout(repacked, column_count)
    return repacked


def compact_after_remove(
    items: list[PanelPlacement],
    removed: PanelPlacement,
    column_count: int,
) -> list[PanelPlacement]:
    """Fill the removed tile gap by expanding neighbors, then repack if needed."""
    if not items:
        return items

    expanders = (
        lambda: _expand_east_neighbors_into_removed(items, removed),
        lambda: _expand_west_neighbors_into_removed(items, removed),
        lambda: _expand_north_neighbors_into_removed(items, removed),
        lambda: _expand_south_neighbors_into_removed(items, removed),
        lambda: _expand_primary_neighbor_into_removed(items, removed),
    )
    for expand in expanders:
        candidate = expand()
        if candidate is None:
            continue
        try:
            assert_packed_layout(candidate, column_count)
        except AppError:
            continue
        return candidate

    return repack_panel_grid(items, column_count)

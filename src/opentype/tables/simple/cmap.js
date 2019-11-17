import { Parser } from "../../../parser.js";
import { SimpleTable } from "../simple-table.js";
import lazy from "../../../lazy.js";
import createSubTable from "./cmap/createSubTable.js";

/**
 * The OpenType `cmap` main table.
 *
 * Subtables are found in the ./cmap directory
 */
class cmap extends SimpleTable {
    constructor(dict, dataview) {
        const { p } = super(`cmap`, dict, dataview);

        this.version = p.uint16;
        this.numTables = p.uint16;

        const getter = () => [...new Array(this.numTables)].map(_ => new EncodingRecord(p));
        lazy(this, `encodingRecords`, getter);

        // cache these values for use in `.get(tableID)`
        this.subTableStart = dict.offset;
    }

    get(tableID) {
        let record = this.encodingRecords[tableID];
        if (record) {
            const dict = { offset: this.subTableStart + record.offset };
            const p = new Parser(`Cmap subtable record ${tableID}`, dict, this.parser.data);
            const format = p.uint16;
            return createSubTable(format, p);
        }
    }

    supports(char) {
        return this.encodingRecords.some((_,tableID) => {
            const t = this.get(tableID);
            return t.supports && t.supports(char) !== false;
        });
    }

    supportsVariation(variation) {
        return this.encodingRecords.some((_,tableID) => {
            const t = this.get(tableID);
            return t.supportsVariation && t.supportsVariation(variation) !== false;
        });
    }
}

/**
 * ...docs go here...
 */
class EncodingRecord {
    constructor(p) {
        this.platformID = p.uint16;
        this.encodingID = p.uint16;
        this.offset = p.offset32;
    }
}

export { cmap };
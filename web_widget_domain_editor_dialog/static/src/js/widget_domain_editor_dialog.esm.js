/** @odoo-module **/
/* Copyright 2019 Tecnativa - David Vidal
 * Copyright 2024 Tecnativa - Carlos Roca
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl). */
import {SelectCreateDialog} from "@web/views/view_dialogs/select_create_dialog";
import {Domain} from "@web/core/domain";

export function findChildren(comp, predicate = (e) => e) {
    const queue = [];
    [].unshift.apply(queue, Object.values(comp.__owl__.children));

    while (queue.length > 0) {
        const curNode = queue.pop();
        if (predicate(curNode)) {
            return curNode;
        }
        [].unshift.apply(queue, Object.values(curNode.component.__owl__.children));
    }
}

export class DomainEditorDialog extends SelectCreateDialog {
    /**
     * Bind this to allow call get_domain from onSelected function definition.
     *
     * @override
     */
    async select(resIds) {
        if (this.props.onSelected) {
            const onselected = this.props.onSelected.bind(this);
            await onselected(resIds);
            this.props.close();
        }
    }

    _getDomainOfGroups(groups, domain) {
        const groups_unfolded = _.filter(groups, (g) => !g.isFolded);
        var groups_domain = [];
        for (var group of groups_unfolded) {
            var group_list = group.list;
            if (group_list.groupBy.length) {
                groups_domain.push(this._getDomainOfGroups(group_list.groups, domain));
            } else {
                var group_domain = group_list.domain;
                _.each(domain, (d) => {
                    group_domain = _.without(
                        group_domain,
                        _.filter(group_domain, (x) => {
                            return _.isEqual(x, d);
                        })[0]
                    );
                });
                group_domain = _.without(group_domain, "&");
                groups_domain.push(group_domain);
            }
        }
        return Domain.or(groups_domain).toList();
    }

    get_domain(resIds) {
        const dynamicList = findChildren(
            this,
            (node) =>
                node.component &&
                node.component.model &&
                node.component.model.root &&
                ["DynamicGroupList", "DynamicRecordList"].includes(
                    node.component.model.root.constructor.name
                )
        ).component.model.root;
        let domain = dynamicList.domain;
        let group_domain = [];
        if ($(".o_list_record_selector input").prop("checked")) {
            if (dynamicList.groupBy.length) {
                group_domain = this._getDomainOfGroups(dynamicList.groups, domain);
            }
        } else {
            domain = domain.concat([["id", "in", resIds]]);
        }
        return JSON.stringify(domain.concat(group_domain));
    }
}

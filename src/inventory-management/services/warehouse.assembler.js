import {Warehouse} from "@/inventory-management/model/warehouse.entity.js";

export class WarehouseAssembler {

    static toEntityFromResource(resource) {
        const r = resource || {};
        return new Warehouse({
            warehouseId: r.warehouseId ?? r.WarehouseId ?? '',
            name: r.name ?? r.Name ?? '',
            street: r.addressStreet ?? r.AddressStreet ?? r.street ?? r.Street ?? '',
            city: r.addressCity ?? r.AddressCity ?? r.city ?? r.City ?? '',
            district: r.addressDistrict ?? r.AddressDistrict ?? r.district ?? r.District ?? '',
            postalCode: r.addressPostalCode ?? r.AddressPostalCode ?? r.postalCode ?? r.PostalCode ?? '',
            country: r.addressCountry ?? r.AddressCountry ?? r.country ?? r.Country ?? '',
            maxTemperature: Number(r.temperatureMax ?? r.TemperatureMax ?? r.maxTemperature ?? r.MaxTemperature ?? 0),
            minTemperature: Number(r.temperatureMin ?? r.TemperatureMin ?? r.minTemperature ?? r.MinTemperature ?? 0),
            capacity: Number(r.capacity ?? r.Capacity ?? 0),
            imageUrl: r.imageUrl ?? r.ImageUrl ?? '',
            profileId: r.profileId ?? r.ProfileId ?? '',
        });
    }

    static toEntitiesFromResources(response) {
        if (!response.data || response.data.error) {
            console.error(response.data.error);
            return [];
        }
        return response.data.map(resource => this.toEntityFromResource(resource));
    }
}
package com.stationery.request.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class RequestSubmitDto {
    
    @NotEmpty(message = "Request must contain at least one item")
    @Valid
    private List<RequestItemDto> items;

    public List<RequestItemDto> getItems() { return items; }
    public void setItems(List<RequestItemDto> items) { this.items = items; }
}

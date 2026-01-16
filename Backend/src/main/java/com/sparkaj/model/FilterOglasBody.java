package com.sparkaj.model;

public class FilterOglasBody {
	private String location;
	private float priceMin;
	private float priceMax;
	private String dateFrom;
	private String dateTo;
	
	public FilterOglasBody(String location, float priceMin, float priceMax, String dateFrom, String dateTo) {
		this.location = location;
		this.priceMin = priceMin;
		this.priceMax = priceMax;
		this.dateFrom = dateFrom;
		this.dateTo = dateTo;
	}
	
	public FilterOglasBody() {}
	
	public String getLocation() {
		return location;
	}
	
	public void setLocation(String location) {
		this.location = location;
	}
	
	public float getPriceMin() {
		return priceMin;
	}
	
	public void setPriceMin(float priceMin) {
		this.priceMin = priceMin;
	}
	
	public float getPriceMax() {
		return priceMax;
	}
	
	public void setPriceMax(float priceMax) {
		this.priceMax = priceMax;
	}
	
	public String getDateFrom() {
		return dateFrom;
	}
	
	public void setDateFrom(String dateFrom) {
		this.dateFrom = dateFrom;
	}
	
	public String getDateTo() {
		return dateTo;
	}
	
	public void setDateTo(String dateTo) {
		this.dateTo = dateTo;
	}
	
}
